// This file has been automatically generated.

// To the extent that this code is derived from the "mime-db" project,
// it falls under the following copyright/licence:

// Copyright (c) 2014 Jonathan Ong <me@jongleberry.com>
// Copyright (c) 2015-2022 Douglas Christopher Wilson <doug@somethingdoug.com>
//
// Permission is hereby granted, free of charge, to any person obtaining
// a copy of this software and associated documentation files (the
// 'Software'), to deal in the Software without restriction, including
// without limitation the rights to use, copy, modify, merge, publish,
// distribute, sublicense, and/or sell copies of the Software, and to
// permit persons to whom the Software is furnished to do so, subject to
// the following conditions:
//
// The above copyright notice and this permission notice shall be
// included in all copies or substantial portions of the Software.
//
// THE SOFTWARE IS PROVIDED 'AS IS', WITHOUT WARRANTY OF ANY KIND,
// EXPRESS OR IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF
// MERCHANTABILITY, FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT.
// IN NO EVENT SHALL THE AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY
// CLAIM, DAMAGES OR OTHER LIABILITY, WHETHER IN AN ACTION OF CONTRACT,
// TORT OR OTHERWISE, ARISING FROM, OUT OF OR IN CONNECTION WITH THE
// SOFTWARE OR THE USE OR OTHER DEALINGS IN THE SOFTWARE.

export const typeFromExtension = (() => {
    const extensionsWithTypes = JSON.parse("[[\"3gpp\", \"audio/3gpp\"], [\"adts\", \"audio/aac\"], [\"aac\", \"audio/aac\"], [\"adp\", \"audio/adpcm\"], [\"amr\", \"audio/amr\"], [\"au\", \"audio/basic\"], [\"snd\", \"audio/basic\"], [\"mid\", \"audio/midi\"], [\"midi\", \"audio/midi\"], [\"kar\", \"audio/midi\"], [\"rmi\", \"audio/midi\"], [\"mxmf\", \"audio/mobile-xmf\"], [\"mp3\", \"audio/mpeg\"], [\"m4a\", \"audio/mp4\"], [\"mp4a\", \"audio/mp4\"], [\"mpga\", \"audio/mpeg\"], [\"mp2\", \"audio/mpeg\"], [\"mp2a\", \"audio/mpeg\"], [\"m2a\", \"audio/mpeg\"], [\"m3a\", \"audio/mpeg\"], [\"oga\", \"audio/ogg\"], [\"ogg\", \"audio/ogg\"], [\"spx\", \"audio/ogg\"], [\"opus\", \"audio/ogg\"], [\"s3m\", \"audio/s3m\"], [\"sil\", \"audio/silk\"], [\"uva\", \"audio/vnd.dece.audio\"], [\"uvva\", \"audio/vnd.dece.audio\"], [\"eol\", \"audio/vnd.digital-winds\"], [\"dra\", \"audio/vnd.dra\"], [\"dts\", \"audio/vnd.dts\"], [\"dtshd\", \"audio/vnd.dts.hd\"], [\"lvp\", \"audio/vnd.lucent.voice\"], [\"pya\", \"audio/vnd.ms-playready.media.pya\"], [\"ecelp4800\", \"audio/vnd.nuera.ecelp4800\"], [\"ecelp7470\", \"audio/vnd.nuera.ecelp7470\"], [\"ecelp9600\", \"audio/vnd.nuera.ecelp9600\"], [\"rip\", \"audio/vnd.rip\"], [\"wav\", \"audio/wav\"], [\"weba\", \"audio/webm\"], [\"aif\", \"audio/x-aiff\"], [\"aiff\", \"audio/x-aiff\"], [\"aifc\", \"audio/x-aiff\"], [\"caf\", \"audio/x-caf\"], [\"flac\", \"audio/x-flac\"], [\"mka\", \"audio/x-matroska\"], [\"m3u\", \"audio/x-mpegurl\"], [\"wax\", \"audio/x-ms-wax\"], [\"wma\", \"audio/x-ms-wma\"], [\"ram\", \"audio/x-pn-realaudio\"], [\"ra\", \"audio/x-pn-realaudio\"], [\"rmp\", \"audio/x-pn-realaudio-plugin\"], [\"xm\", \"audio/xm\"], [\"exr\", \"image/aces\"], [\"apng\", \"image/apng\"], [\"avci\", \"image/avci\"], [\"avcs\", \"image/avcs\"], [\"avif\", \"image/avif\"], [\"bmp\", \"image/bmp\"], [\"dib\", \"image/bmp\"], [\"cgm\", \"image/cgm\"], [\"drle\", \"image/dicom-rle\"], [\"dpx\", \"image/dpx\"], [\"emf\", \"image/emf\"], [\"fits\", \"image/fits\"], [\"g3\", \"image/g3fax\"], [\"gif\", \"image/gif\"], [\"heic\", \"image/heic\"], [\"heics\", \"image/heic-sequence\"], [\"heif\", \"image/heif\"], [\"heifs\", \"image/heif-sequence\"], [\"hej2\", \"image/hej2k\"], [\"hsj2\", \"image/hsj2\"], [\"ief\", \"image/ief\"], [\"jls\", \"image/jls\"], [\"jp2\", \"image/jp2\"], [\"jpg2\", \"image/jp2\"], [\"jpeg\", \"image/jpeg\"], [\"jpg\", \"image/jpeg\"], [\"jpe\", \"image/jpeg\"], [\"jph\", \"image/jph\"], [\"jhc\", \"image/jphc\"], [\"jpm\", \"image/jpm\"], [\"jpgm\", \"image/jpm\"], [\"jpx\", \"image/jpx\"], [\"jpf\", \"image/jpx\"], [\"jxr\", \"image/jxr\"], [\"jxra\", \"image/jxra\"], [\"jxrs\", \"image/jxrs\"], [\"jxs\", \"image/jxs\"], [\"jxsc\", \"image/jxsc\"], [\"jxsi\", \"image/jxsi\"], [\"jxss\", \"image/jxss\"], [\"ktx\", \"image/ktx\"], [\"ktx2\", \"image/ktx2\"], [\"png\", \"image/png\"], [\"btif\", \"image/prs.btif\"], [\"btf\", \"image/prs.btif\"], [\"pti\", \"image/prs.pti\"], [\"sgi\", \"image/sgi\"], [\"svg\", \"image/svg+xml\"], [\"svgz\", \"image/svg+xml\"], [\"t38\", \"image/t38\"], [\"tif\", \"image/tiff\"], [\"tiff\", \"image/tiff\"], [\"tfx\", \"image/tiff-fx\"], [\"psd\", \"image/vnd.adobe.photoshop\"], [\"azv\", \"image/vnd.airzip.accelerator.azv\"], [\"uvi\", \"image/vnd.dece.graphic\"], [\"uvvi\", \"image/vnd.dece.graphic\"], [\"uvg\", \"image/vnd.dece.graphic\"], [\"uvvg\", \"image/vnd.dece.graphic\"], [\"djvu\", \"image/vnd.djvu\"], [\"djv\", \"image/vnd.djvu\"], [\"sub\", \"image/vnd.dvb.subtitle\"], [\"dwg\", \"image/vnd.dwg\"], [\"dxf\", \"image/vnd.dxf\"], [\"fbs\", \"image/vnd.fastbidsheet\"], [\"fpx\", \"image/vnd.fpx\"], [\"fst\", \"image/vnd.fst\"], [\"mmr\", \"image/vnd.fujixerox.edmics-mmr\"], [\"rlc\", \"image/vnd.fujixerox.edmics-rlc\"], [\"ico\", \"image/vnd.microsoft.icon\"], [\"dds\", \"image/vnd.ms-dds\"], [\"mdi\", \"image/vnd.ms-modi\"], [\"wdp\", \"image/vnd.ms-photo\"], [\"npx\", \"image/vnd.net-fpx\"], [\"b16\", \"image/vnd.pco.b16\"], [\"tap\", \"image/vnd.tencent.tap\"], [\"vtf\", \"image/vnd.valve.source.texture\"], [\"wbmp\", \"image/vnd.wap.wbmp\"], [\"xif\", \"image/vnd.xiff\"], [\"pcx\", \"image/vnd.zbrush.pcx\"], [\"webp\", \"image/webp\"], [\"wmf\", \"image/wmf\"], [\"3ds\", \"image/x-3ds\"], [\"ras\", \"image/x-cmu-raster\"], [\"cmx\", \"image/x-cmx\"], [\"fh\", \"image/x-freehand\"], [\"fhc\", \"image/x-freehand\"], [\"fh4\", \"image/x-freehand\"], [\"fh5\", \"image/x-freehand\"], [\"fh7\", \"image/x-freehand\"], [\"jng\", \"image/x-jng\"], [\"sid\", \"image/x-mrsid-image\"], [\"pic\", \"image/x-pict\"], [\"pct\", \"image/x-pict\"], [\"pnm\", \"image/x-portable-anymap\"], [\"pbm\", \"image/x-portable-bitmap\"], [\"pgm\", \"image/x-portable-graymap\"], [\"ppm\", \"image/x-portable-pixmap\"], [\"rgb\", \"image/x-rgb\"], [\"tga\", \"image/x-tga\"], [\"xbm\", \"image/x-xbitmap\"], [\"xpm\", \"image/x-xpixmap\"], [\"xwd\", \"image/x-xwindowdump\"]]")
    const typeFromExtensionMap = new Map<string, string>(extensionsWithTypes);
    return (extension: string) => typeFromExtensionMap.get(extension) || false;
})();

