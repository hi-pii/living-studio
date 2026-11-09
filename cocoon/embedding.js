const embeddingNode = "module_apply_default/MobilenetV2/Logits/AvgPool";

function embedCocoonImage(tf, backbone, pixels) {
  return tf.tidy(() => {
    const [height, width] = pixels.shape;
    const side = Math.min(width, height);
    const crop = pixels.slice(
      [Math.floor((height - side) / 2), Math.floor((width - side) / 2), 0],
      [side, side, 3]
    );
    const image = tf.image.resizeBilinear(crop.toFloat(), [224, 224]).div(255).expandDims(0);
    const features = backbone.execute(image, embeddingNode).reshape([1, -1]);
    return features.div(features.norm(2, 1, true).maximum(1e-8)).mul(16);
  });
}

if (typeof module !== "undefined") module.exports = { embedCocoonImage };
