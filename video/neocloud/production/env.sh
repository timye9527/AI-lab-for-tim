# 本机模型路径（模型放在仓库根 .cache/models，不提交）
M=$(cd "$(dirname "${BASH_SOURCE[0]}")/../../.." && pwd)/.cache/models
export ZIPVOICE_DIR=$M ZIPVOICE_LEX=$M/sherpa-onnx-zipvoice-distill-int8-zh-en-emilia
export ASR_DIR=$M/sherpa-onnx-paraformer-zh-small-2024-03-09 KOKORO_DIR=$M/kokoro-int8-multi-lang-v1_1
export CHROME=${CHROME:-/opt/pw-browsers/chromium-1243/chrome-linux64/chrome}
