# About 🗞️

This extension takes your latest copied image from your clipboard and converts the math to latex and inserts it at your position in the editor. See GIF below for example of usage with a keybinding:
![](docs/example.gif)
A couple of things happen here

1. I take a screenshot of the formula on the left
2. I use a keybinding to trigger the OCRToLatex
3. A loading indicator is inserted

# Getting started 🚀

To get started first get an api token, see below. Then go to settings and insert it. After this you are ready to use the plugin. Try to snip a math formula to your clipboard and run the command `Generate latex from last image to clipboard`

## Getting API Token 🔐

To use this plugin you need to create a developer account at https://simpletex.cn. Below I describe how to do this

1. Go to https://simpletex.cn/api
2. Click "Go to API Dashboard"
3. Create an account
4. After this go to `User Access Token` and click `Create token`
5. Copy the token and paste into Obsidian settings ![](docs/UAT.png)
6. Now you are ready to use the addon 🥳

# Future improvements ✅

-   [ ] Convert already pasted images
-   [ ] Use https://github.com/lukas-blecher/LaTeX-OCR for self hosted version
