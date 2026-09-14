"""
Uploads the fine-tuned disease model to the HuggingFace Space.

WHY THIS IS A SCRIPT RATHER THAN A CHAT MESSAGE
-----------------------------------------------
A write token is a credential. Pasted into a conversation it lives in the
transcript afterwards, which is the situation the Brevo and Gmail credentials
in this project are already in. This reads the token from the environment or
from an interactive prompt, so it is never typed anywhere it will be kept.

WHAT IT REPLACES
----------------
Three files, uploaded together because they only make sense together: the
model, the labels that name its outputs, and the app that maps those names to
treatment advice. The model emits 32 classes where the live one emits 38, so
every index has moved - sending the model alone would mislabel every
prediction silently.

Measured on 1,581 held-out field photographs:

                              live      new
    disease identified        28.0%    86.9%
    crop identified           49.2%    98.5%
    healthy called diseased     42%       8%
    crops covered                 7        9   (wheat and rice are new)

The live model cannot diagnose wheat or rice at all - a farmer photographing
wheat gets a confident answer about a tomato.

BEFORE RUNNING
--------------
Get a token at https://huggingface.co/settings/tokens with write access to
karishma-devs-smartkisan-plant-disease. Then either:

    set HF_TOKEN=hf_...                 (Windows, this shell only)
    export HF_TOKEN=hf_...              (bash)

or just run the script and paste it when asked — it is read without echo.

    .venv/Scripts/python.exe deploy_to_space.py            # upload
    .venv/Scripts/python.exe deploy_to_space.py --dry-run  # check only

AFTERWARDS
----------
The Space rebuilds itself, which takes a couple of minutes. Confirm the live
endpoint really changed with:

    cd ../weedDetection
    python evaluate_disease_model.py --limit 3

That posts to the deployed service rather than reading a local file, so it
measures what farmers will actually get.
"""

import argparse
import getpass
import os
import shutil
import sys

HERE = os.path.dirname(os.path.abspath(__file__))

REPO_ID = 'karishma-devs/smartkisan-plant-disease'
REPO_TYPE = 'space'

# Three files, and they must travel together.
#
# The India model emits 32 classes where the previous one emitted 38, so every
# index has moved. The service maps index to name through class_labels.json and
# looks up treatment text by that name, so uploading the model without the
# labels mislabels every prediction silently - worse than not deploying at all.
# app.py carries the rice and wheat treatments, which the old one has no
# entries for, and reads the input size from the model rather than assuming 224.
#
# This list previously named model/field/field_model.tflite and was not updated
# when the India model replaced it, so it deployed the wrong weights once. The
# class-count check below exists because of that.
UPLOADS = [
    (os.path.join(HERE, 'model', 'india', 'india_model.tflite'),
     'plant_disease_model.tflite'),
    (os.path.join(HERE, 'model', 'india', 'class_labels_india.json'),
     'class_labels.json'),
    (os.path.join(HERE, 'huggingface_india', 'app.py'),
     'app.py'),
]

CANDIDATE = UPLOADS[0][0]
LIVE_COPY = os.path.join(HERE, 'huggingface', 'plant_disease_model.tflite')
REMOTE_PATH = 'plant_disease_model.tflite'


def require_hub():
    try:
        from huggingface_hub import HfApi  # noqa: F401
    except ImportError:
        sys.exit(
            'huggingface_hub is not installed. Install it into this venv first:\n'
            '  .venv/Scripts/python.exe -m pip install huggingface_hub'
        )


def main():
    ap = argparse.ArgumentParser()
    ap.add_argument('--dry-run', action='store_true',
                    help='check everything without uploading')
    ap.add_argument('--repo', default=REPO_ID)
    args = ap.parse_args()

    if not os.path.exists(CANDIDATE):
        sys.exit(f'No model to deploy at {CANDIDATE}\n'
                 'Run finetune_field.py first.')

    # The model and the labels must agree on the class count, or every answer
    # is mislabelled. Checked here rather than discovered by a farmer.
    import json as _json
    labels = _json.load(open(UPLOADS[1][0], encoding='utf-8'))
    try:
        import tensorflow as _tf
        _interp = _tf.lite.Interpreter(model_path=CANDIDATE)
        _interp.allocate_tensors()
        n_out = int(_interp.get_output_details()[0]['shape'][-1])
        if n_out != len(labels):
            sys.exit('Model emits %d classes but class_labels.json has %d. '
                     'These must match exactly.' % (n_out, len(labels)))
        print('checked:   model and labels agree on %d classes' % n_out)
    except ImportError:
        print('  note: TensorFlow unavailable, class-count check skipped')

    print('target:    %s' % args.repo)
    for local, remote in UPLOADS:
        print('  %-26s -> %-28s %.1f MB'
              % (os.path.basename(local), remote,
                 os.path.getsize(local) / 1e6))

    if args.dry_run:
        print('\ndry run: nothing uploaded.')
        return

    require_hub()
    from huggingface_hub import HfApi

    token = os.environ.get('HF_TOKEN') or os.environ.get('HUGGINGFACE_TOKEN')
    if not token:
        # getpass rather than input, so the token is not echoed into the
        # terminal history.
        token = getpass.getpass('HuggingFace write token (not shown): ').strip()
    if not token:
        sys.exit('No token given.')

    api = HfApi(token=token)

    # Fail on a bad token now, with a clear message, rather than midway
    # through an upload.
    try:
        who = api.whoami()
        print(f'\nauthenticated as: {who.get("name", "?")}')
    except Exception as e:
        sys.exit(f'Token rejected: {e}')

    # Keep the file that is being replaced. If the new model turns out worse
    # in the wild, putting the old one back should not require retraining it.
    backup = LIVE_COPY + '.replaced'
    if os.path.exists(LIVE_COPY) and not os.path.exists(backup):
        shutil.copy2(LIVE_COPY, backup)
        print(f'kept the current live model at {backup}')

    print(f'\nuploading to {args.repo} ...')
    for local, remote in UPLOADS:
        print('  %s' % remote)
        api.upload_file(
            path_or_fileobj=local,
            path_in_repo=remote,
            repo_id=args.repo,
            repo_type=REPO_TYPE,
            commit_message='India-focused model: 32 classes, 87% on field photographs',
        )

    # Keep the repo copy in step, so what is committed here matches what runs.
    shutil.copy2(CANDIDATE, LIVE_COPY)

    print('\ndone. The Space will rebuild itself; give it a couple of minutes.')
    print('Then confirm the live endpoint actually changed:')
    print('  cd ../weedDetection')
    print('  python evaluate_disease_model.py --limit 3')
    print('\nExpect roughly 87% on a full run, against 28% before.')


if __name__ == '__main__':
    main()
