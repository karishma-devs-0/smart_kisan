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
The Space loads plant_disease_model.tflite. That file is what serves every
scan, and the .keras beside it is not used at inference — worth knowing,
because the two are different models and have been for some time.

Measured on PlantDoc's 236 held-out field photographs:

                              live      new
    disease identified        28.0%    58.1%
    crop identified           49.2%    78.8%
    healthy called diseased     47%       8%
    confidently wrong           59%      15%

The healthy row is the one to look at. The live model answers "diseased" to
almost anything, so nearly half of healthy plants come back with a fungicide
recommendation attached.

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

CANDIDATE = os.path.join(HERE, 'model', 'field', 'field_model.tflite')
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

    size = os.path.getsize(CANDIDATE)
    print(f'candidate: {CANDIDATE} ({size / 1e6:.1f} MB)')
    print(f'target:    {args.repo} -> {REMOTE_PATH}')

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
    api.upload_file(
        path_or_fileobj=CANDIDATE,
        path_in_repo=REMOTE_PATH,
        repo_id=args.repo,
        repo_type=REPO_TYPE,
        commit_message='Fine-tuned on field photographs: 28% to 58% on PlantDoc test',
    )

    # Keep the repo copy in step, so what is committed here matches what runs.
    shutil.copy2(CANDIDATE, LIVE_COPY)

    print('\ndone. The Space will rebuild itself; give it a couple of minutes.')
    print('Then confirm the live endpoint actually changed:')
    print('  cd ../weedDetection')
    print('  python evaluate_disease_model.py --limit 3')
    print('\nExpect roughly 58% rather than 28% on a full run.')


if __name__ == '__main__':
    main()
