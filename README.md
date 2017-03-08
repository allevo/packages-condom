# packages-condom
Check your code are not using some dev dependencies

## Why
In the build process, your code will be tested with non-production packages. In fact all dev dependencies are installed too.
Your production code can require some dev dependencies and crash at runtime.
This module search in your code all required modules and check if those are defined as dependencies or peer dependencies.

## Install

```
npm install -g packages-condom
```

## Usage

```
packages-condom <path>
```

## Todo

 - Better output
