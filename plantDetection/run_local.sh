#!/bin/bash
# Local GPU training launcher for WSL2 + Ubuntu + RTX 50-series
# Usage: bash run_local.sh

set -e

VENV=/home/kartik/plant-disease-env
NV=$VENV/lib/python3.12/site-packages/nvidia

if [ ! -d "$VENV" ]; then
    echo "Error: venv not found at $VENV"
    echo "Run: python3 -m venv $VENV && source $VENV/bin/activate && pip install -r requirements_local.txt"
    exit 1
fi

source $VENV/bin/activate

# TF cu12 wheels don't auto-set library paths — set them manually
export LD_LIBRARY_PATH="$NV/cublas/lib:$NV/cuda_cupti/lib:$NV/cuda_nvrtc/lib:$NV/cuda_runtime/lib:$NV/cudnn/lib:$NV/cufft/lib:$NV/curand/lib:$NV/cusolver/lib:$NV/cusparse/lib:$NV/nccl/lib:$NV/nvjitlink/lib"

# Cache PTX-compiled kernels so the slow first-run JIT only happens once
export CUDA_CACHE_PATH=$HOME/.nv/ComputeCache
mkdir -p "$CUDA_CACHE_PATH"
export CUDA_CACHE_MAXSIZE=4294967296  # 4 GB cache

# Reduce TF log noise
export TF_CPP_MIN_LOG_LEVEL=1

# Read dataset and write split inside WSL fs (much faster than /mnt/d)
# Final model still saves to OUTPUT_DIR on the Windows mount so it's visible from VS Code
export SMARTKISAN_DATASET_DIR=/home/kartik/plantvillage_color
export SMARTKISAN_SPLIT_DIR=/home/kartik/plant_split

cd "$(dirname "$0")"
exec python train_model.py
