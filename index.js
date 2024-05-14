const spawn = require('cross-spawn')
const path = require('path')
const fs = require('fs')

const binPath = path.join(__dirname, 'jxr_to_avif.exe')
const ffmpegbinPath = path.join(__dirname, 'ffmpeg.exe')

const assetsSrcDir = path.join(__dirname, 'assets', 'src')
const assetsDistDir = path.join(__dirname, 'assets', 'dist')

const res = fs.readdirSync(assetsSrcDir)

console.log('binPath', binPath)
const fileName = (p) => path.parse(p).name
const dirName = (p) => path.dirname(p)

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
    proc.on('close', async (code, signal) => {
      let err
      if (code !== 0 || signal !== null) {
        err = new Error('Command failed: ' + stderr)
        err.code = code
        err.signal = signal
      }
      console.log(stdout)
      if (err) console.log('err: ', err)
      else {
        await compress(args[1])
        await unlink(args[1])
        res()
      }
    })
  })
}

function ffmpegArgs(p) {
  const w = 1920
  const destPath = dirName(p)
  const outName = fileName(p).split(' ').join('_') + '_compressed_w' + w
  const outFile = `${destPath}/${outName}.avif`
  return [
    '-i',
    p,
    '-ss',
    '00:00:00',
    '-map',
    '0:v',
    '-frames:v',
    '1',
    '-vf',
    `scale=${w}:-1`,
    '-crf',
    '0',
    '-pix_fmt',
    'yuv444p12le',
    outFile,
  ]
}
function compress(target) {
  return new Promise((res, rej) => {
    const args = ffmpegArgs(target)
    const proc = spawn(ffmpegbinPath, args)
    let stdout = '',
      stderr = ''
    proc.on('error', function (err) {
      rej(err)
    })
    proc.stdout.on(
      'data',
      (onOut = function (data) {
        stdout += data
      })
    )
    proc.stderr.on(
      'data',
      (onErr = function (data) {
        stderr += data
      })
    )
    proc.on('close', async (code, signal) => {
      let err
      if (code !== 0 || signal !== null) {
        err = new Error('Command failed: ' + stderr)
        err.code = code
        err.signal = signal
      }
      console.log(stdout)
      console.log(stderr)
      if (err) console.log('err: ', err)
      else {
        res()
      }
    })
  })
}

function unlink(f) {
  return new Promise((res, rej) => {
    fs.unlink(f, (err) => {
      if (err) {
        rej(err)
        throw err
      } else {
        res()
      }
    })
  })
}
;(async function () {
  for (const e of res) {
    await single(e)
  }
})()
