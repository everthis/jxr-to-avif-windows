const spawn = require('cross-spawn')
const path = require('path')
const fs = require('fs')

const binPath = path.join(__dirname, 'jxr_to_avif.exe')

const assetsSrcDir = path.join(__dirname, 'assets', 'src')
const assetsDistDir = path.join(__dirname, 'assets', 'dist')

const res = fs.readdirSync(assetsSrcDir)

console.log('binPath', binPath)
const fileName = (p) => path.parse(p).name

function single(t) {
  return new Promise((res, rej) => {
    const fn = fileName(t)
    const args = [assetsSrcDir + '/' + t, assetsDistDir + '/' + fn + '.avif']
    const proc = spawn(binPath, args)
    let stdout = ''
    proc.on('error', function (err) {
      rej(err)
    })
    proc.stdout.on(
      'data',
      (onOut = function (data) {
        stdout += data
      })
    )
    proc.on('close', (code, signal) => {
      let err
      if (code !== 0 || signal !== null) {
        err = new Error('Command failed: ' + stderr)
        err.code = code
        err.signal = signal
      } else {
        res()
      }
      console.log(stdout)
      if (err) console.log('err: ', err)
    })
  })
}

;(async function () {
  for (const e of res) {
    await single(e)
  }
})()
