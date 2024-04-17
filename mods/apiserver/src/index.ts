#!/usr/bin/env node

function sleep(ms: number) {
  return new Promise(resolve => setTimeout(resolve, ms));
}

async function main() {
  while (true) {
    console.log('Hello, world!');
    await sleep(3600000);
  }
}