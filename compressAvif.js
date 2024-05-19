const { compress, srcAvifAssets, assetsDistDir, cleanDist } = require('./index')

;(async function () {
  await cleanDist()
  for (const e of srcAvifAssets) {
    await compress(e, assetsDistDir)
  }
})()
