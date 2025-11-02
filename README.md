# Haskell Copy Extension

A VS Code extension that provides enhanced copy functionality written in Haskell and compiled to WebAssembly.

## Features

This extension enhances the copy functionality in VS Code by:

- Adding support for copying with special handling through WebAssembly
- Providing seamless integration with VS Code's clipboard functionality
- Written in Haskell for robust and type-safe code

## Requirements

- Visual Studio Code 1.60.0 or higher

## Installation

You can install this extension through the VS Code marketplace:

1. Open VS Code
2. Go to Extensions (Ctrl+Shift+X)
3. Search for "Haskell Copy Extension"
4. Click Install

## Usage

The extension works automatically when you copy text in VS Code. No additional configuration is required.

Default keyboard shortcuts:
- Chain Copies: `Ctrl+C` 
- Clear Buffer: `Ctrl+Alt+C` 

## Development

This extension is built using:
- Haskell (core functionality)
- WebAssembly (compilation target)
- VS Code Extension API

To build from source:

1. Clone the repository
2. Run `npm install`
3. Build the Haskell code 
4. Package the extension

## Known Issues

No known issues at this time. Please report any bugs on the GitHub repository.

## Contributing

Contributions are welcome! Please feel free to submit a Pull Request.

## License

This project is licensed under the MIT License - see the LICENSE file for details.

## Release Notes

### 1.0.0

Initial release:
- Basic copy functionality
- WebAssembly integration
- Haskell backend implementation

---

For more information about development, please check:
- [Repository](https://github.com/yourusername/haskell-copy-extension)
- [VS Code Extension Guidelines](https://code.visualstudio.com/api/references/extension-guidelines)
