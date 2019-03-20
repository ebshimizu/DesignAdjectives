const comp = require("./node-compositor/build/Release/compositor");
comp.setLogLevel(1);

const dsDriver = require("./driver/dsNodeDriver");

// load test image (shapes)
c = new comp.Compositor(
  "shapes3.dark",
  "C:/Users/Falindrith/Dropbox/Documents/research/sliders_project/test_images/shapes/"
);

const ss = new dsDriver.dsDriver();
ss.sampleCallback = function(data, snippetName) {
  c.renderContext(c.contextFromVector(data.x)).save(`sample${data.idx}.png`);
};

// let vec = c.getContext().layerVector(c);
// vec[1] = 0.25;
// console.log(c.contextFromVector(vec).layerVector(c));
// c.renderContext(c.contextFromVector(vec)).save("test2.png");

async function main() {
  // make a few configs, vectorize
  let x1 = c.getContext().layerVector(c);
  x1[1] = 0.3;

  let x2 = c.getContext().layerVector(c);
  x2[1] = 0.34;

  let x3 = c.getContext().layerVector(c);
  x3[1] = 0.28;

  let x4 = c.getContext().layerVector(c);
  x4[1] = 0.7;

  // make a snippet
  await ss.deleteSnippet("rectangle hue"); // this is for debug stuff lol
  await ss.addSnippet("rectangle hue");

  // send to snippets thing
  await ss.addData("rectangle hue", x1, 1.0);
  await ss.addData("rectangle hue", x2, 1.0);
  await ss.addData("rectangle hue", x3, 1.0);
  await ss.addData("rectangle hue", x4, 0.0);

  // property testing
  await ss.setProp("rectangle hue", "optSteps", 1000);

  // attempt to train
  await ss.train("rectangle hue");

  // display loss func/1D graph
  //await ss.showLoss("rectangle hue");
  //await ss.plot1D("rectangle hue", x1, 0);

  // eval a few test cases?
  let t1 = c.getContext().layerVector(c);
  t1[1] = 0.32;
  let r = await ss.predictOne("rectangle hue", t1);
  console.log(r);

  // sample some new suggested designs
  let samples = await ss.sample("rectangle hue", {
    qMin: 0.75,
    epsilon: 0.1,
    n: 20,
    burn: 1000,
    stride: 1
  });

  console.log(samples);
}

(async () => {
  try {
    await main();
  } catch (e) {
    console.log(e);
  }
})();
