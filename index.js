const spawn = require('cross-spawn')
const path = require('path')
const fs = require('fs')

const binPath = path.join(__dirname, 'jxr_to_avif.exe')
const ffmpegbinPath = path.join(__dirname, 'ffmpeg.exe')

const assetsSrcJxrDir = path.join(__dirname, 'assets', 'src', 'jxr')
const assetsSrcAvifDir = path.join(__dirname, 'assets', 'src', 'avif')
const assetsDistDir = path.join(__dirname, 'assets', 'dist')

const srcJxrAssets = fs
  .readdirSync(assetsSrcJxrDir)
  .map((e) => path.join(assetsSrcJxrDir, e))
const srcAvifAssets = fs
  .readdirSync(assetsSrcAvifDir)
  .map((e) => path.join(assetsSrcAvifDir, e))

console.log('srcAvifAssets', srcAvifAssets)
console.log('srcJxrAssets', srcJxrAssets)

console.log('binPath', binPath)
const fileName = (p) => path.parse(p).name
const dirName = (p) => path.dirname(p)

function single(t) {
  return new Promise((res, rej) => {
    const fn = fileName(t)
    const args = [t, assetsDistDir + '/' + fn + '.avif']
    const proc = spawn(binPath, args)
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
        await compress(args[1], assetsDistDir)
        await unlink(args[1])
        res()
      }
    })
  })
}

function ffmpegArgs(p, outputDir) {
  const w = 1080
  // const destPath = dirName(p)
  const outName = fileName(p).split(' ').join('_') + '_compressed_w' + w
  const outFile = `${outputDir}/${outName}.avif`
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
    '8', // 0: lossless
    '-pix_fmt',
    'yuv444p10le', // yuv444p10be
    // 'yuv444p12le',
    '-y',
    outFile,
  ]
}

function ffmpegAvifArgs(p, outputDir) {
  const w = 1080
  // const destPath = dirName(p)
  const outName = fileName(p).split(' ').join('_') + '_compressed_w' + w
  const outFile = `${outputDir}/${outName}.avif`
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
    '8', // 0: lossless
    '-pix_fmt',
    'yuv420p', // yuv444p10be
    // 'yuv444p12le',
    '-y',
    outFile,
  ]
}

function ffmpegVideoArgs(p, outputDir) {
  const w = 1080
  const outName = fileName(p).split(' ').join('_') + '_compressed_w' + w
  const outFile = path.join(outputDir, `${outName}.mov`)
  return [
    '-i',
    p,
    // '-c',
    // 'copy',
    '-vcodec',
    'hevc',
    '-vf',
    'pad=ceil(iw/2)*2:ceil(ih/2)*2',
    // 'pad=ceil(iw/2)*2:ceil(ih/2)*2,zscale=transfer=smpte2084',
    // 'format=rgba',
    '-profile:v',
    'main10',
    // '-level',
    // '3.1',
    // '-c:a',
    // 'aac',
    '-tag:v',
    'hvc1',
    // '-color_range',
    // '1',
    '-pix_fmt',
    'yuv420p',
    '-color_primaries',
    '12',
    // '-brand',
    // 'qt',
    '-colorspace',
    '1',
    // '-color_trc',
    // 'smpte2084',
    // '-movflags',
    // '+faststart',
    outFile,
  ]
  return [
    '-i',
    p,
    '-c:v',
    'h264',
    '-t',
    '1',
    '-vf',
    `loop=-1:1,scale=${w}:-1`,
    '-color_range',
    'pc',
    '-crf',
    '17', // 0: lossless
    '-profile:v',
    'baseline',
    '-colorspace',
    'bt2020nc',
    '-color_primaries',
    'bt2020',
    '-color_trc',
    'smpte2084 ',
    '-pix_fmt',
    'yuv420p', // yuv444p10be
    // 'yuv444p12le',
    '-movflags',
    'faststart',
    '-y',
    outFile,
  ]
}
function compress(src, outputDir) {
  return new Promise((res, rej) => {
    const args = ffmpegArgs(src, outputDir)
    // const args = ffmpegVideoArgs(src, outputDir)
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

async function cleanDist() {
  const arr = fs.readdirSync(assetsDistDir)
  for (const e of arr) {
    if (e === '.gitkeep') continue
    await unlink(`${assetsDistDir}/${e}`)
  }
}

module.exports = {
  single,
  compress,
  srcJxrAssets,
  srcAvifAssets,
  assetsDistDir,
  cleanDist,
}
