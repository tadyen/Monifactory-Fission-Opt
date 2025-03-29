#!/bin/sh

MODULES_DIR=./modules
[[ ! -d $MODULES_DIR ]] && mkdir $MODULES_DIR;

# deps
# xtl and xtensor changed their file structure in the latest release
# temporary fix: cloned older, pre-change branches for compatibility
if [[ ! -d $MODULES_DIR\/xtl ]]; then
    git clone --depth 1 https://github.com/xtensor-stack/xtl.git --branch 0.7.7 $MODULES_DIR\/xtl;
    rm -rf $MODULES_DIR\/xtl/.git;
fi

if [[ ! -d $MODULES_DIR\/xtensor ]]; then
    git clone --depth 1 https://github.com/xtensor-stack/xtensor.git --branch 0.25.0 $MODULES_DIR\/xtensor;
    rm -rf $MODULES_DIR\/xtensor/.git;
fi

# compile
echo "compile.sh: em++: compiling...";
em++ --bind -s MODULARIZE=1 -s EXPORT_NAME=FissionOpt -s ALLOW_MEMORY_GROWTH=1 -o ./src/web/FissionOpt.js -std=c++17 -flto -O3 ./src/web/Bindings.cpp ./src/cpp/Fission.cpp ./src/cpp/OptFission.cpp ./src/cpp/FissionNet.cpp ./src/cpp/OverhaulFission.cpp ./src/cpp/OptOverhaulFission.cpp ./src/cpp/OverhaulFissionNet.cpp -I./modules/xtl/include -I./modules/xtensor/include -v \
&& echo "compile.sh: em++: compile finished";

# copy web files out for github pages to run
# cp -f ./src/web/*.{html,css,js,wasm} ./ ;
cp -f ./src/web/{index.html,main.js,main.css,FissionOpt.js,FissionOpt.wasm} ./;
