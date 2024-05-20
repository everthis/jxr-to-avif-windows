const { singleConvert, srcJxrAssets, cleanDist } = require('./index')

;(async function () {
  await cleanDist()
  for (const e of srcJxrAssets) {
    await singleConvert(e)
  }
})()
