#!/bin/bash

# Operating System
function get_os() {
  OS="unknow"

  case "$OSTYPE" in
  linux-gnu*)
    OS="linux"
    ;;
  cygwin* | msys* | win32*)
    OS="windows"
    ;;
  darwin*)
    OS="macos"
    ;;
  *)
    case "$(uname -s)" in
    CYGWIN* | MINGW32* | MINGW64* | MSYS*)
      OS="windows"
      ;;
    esac
    ;;
  esac

  OS=$(echo "$OS" | awk '{print toupper($0)}')

  export OS
}

get_os
