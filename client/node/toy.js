const comp = require("./node-compositor/build/Release/compositor");
comp.setLogLevel(1);

// load test image (shapes)
c = new comp.Compositor(
  "shapes.dark",
  "C:/Users/Falindrith/Dropbox/Documents/research/sliders_project/test_images/shapes/"
);

c.render(c.getContext()).save("test.png");
console.log(JSON.parse(c.getContext().layerKey(c)));

// make a few configs, vectorize

// send to snippets thing

// attempt to train

// display loss func/1D graph

// eval a few test cases?

// sample some new suggested designs
