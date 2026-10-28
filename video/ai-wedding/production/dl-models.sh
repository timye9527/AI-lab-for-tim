set -e
R=https://github.com/k2-fsa/sherpa-onnx/releases/download
get() { f=$(basename $1); [ -e "${f%.tar.bz2}" ] || { curl -sSLf -o $f $R/$1 && case $f in *.tar.bz2) tar xjf $f && rm $f;; esac; echo "ok $f"; } }
get tts-models/matcha-icefall-zh-en.tar.bz2
get vocoder-models/vocos-16khz-univ.onnx
get asr-models/sherpa-onnx-paraformer-zh-small-2024-03-09.tar.bz2
get tts-models/kokoro-int8-multi-lang-v1_1.tar.bz2
get vocoder-models/vocos_24khz.onnx
get tts-models/sherpa-onnx-zipvoice-distill-int8-zh-en-emilia.tar.bz2
get tts-models/sherpa-onnx-zipvoice-zh-en-emilia.tar.bz2
echo ALLDONE
