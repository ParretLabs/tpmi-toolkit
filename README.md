# tpmi-toolkit
**Tools &amp; Algorithms for AI-Generated TagPro Maps**

## Project
This project contains many utilities for developing auto-mapmaking tools (Algorithms or ML).
The toolkit is able to convert normal TagPro maps into "VectorMaps", which contain the same information as normal tagpro maps.
However, instead of being tile-based, VectorMaps are vector-based. Which means that element positions are floats,
and walls are displayed as segments.
![](https://github.com/ParretLabs/tpmi-toolkit/blob/master/examples/assets/randomizer.png?raw=true)

TagPro maps aren't just pixel art. Maps have general shapes and displaying maps as tiles isn't useful to computers.
This new method of displaying maps is more useful and easier to work with when building algorithms as it allows for more flexibility
while building maps.

## Run
Node.js is required to run the examples.

```bash
# Clone the repository
git clone https://github.com/ParretLabs/tpmi-toolkit.git
cd tpmi-toolkit

# Install the packages
npm i
# or
yarn

# Then run one of the examples in the /examples directory
cd /examples/basic
node index.js
```

## Plans
- [ ] Useable on the browser (Currently only executable on Node.js. Client-side use through browserify most likely.)
