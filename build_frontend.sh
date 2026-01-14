#!/bin/bash
export PATH="$HOME/.cargo/bin:$PATH"
export CARGO_TARGET_DIR="/tmp/cargo_target_nexus"

echo "Building in WSL with target dir: $CARGO_TARGET_DIR"

# Install target if missing
rustup target add wasm32-unknown-unknown

cd /mnt/c/Users/haash/.gemini/antigravity/scratch/weilchain-nexus/applets/nexus_frontend

# Clean previous failed attempts if needed (optional)
# cargo clean

# Build
cargo build --release --target wasm32-unknown-unknown

# Copy artifact back to Windows explicitly
mkdir -p /mnt/c/Users/haash/.gemini/antigravity/scratch/weilchain-nexus/applets/nexus_frontend/target/wasm32-unknown-unknown/release
cp $CARGO_TARGET_DIR/wasm32-unknown-unknown/release/nexus_frontend.wasm /mnt/c/Users/haash/.gemini/antigravity/scratch/weilchain-nexus/applets/nexus_frontend/target/wasm32-unknown-unknown/release/nexus_frontend.wasm

echo "Build complete. WASM copied to local target dir."
