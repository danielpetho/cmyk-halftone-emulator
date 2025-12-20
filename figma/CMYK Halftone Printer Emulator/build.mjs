import * as esbuild from 'esbuild';
import * as fs from 'fs';
import * as path from 'path';

const isWatch = process.argv.includes('--watch');

const glslPlugin = {
  name: 'glsl',
  setup(build) {
    build.onLoad({ filter: /\.glsl$/ }, async (args) => {
      const source = await fs.promises.readFile(args.path, 'utf8');
      return {
        contents: `export default ${JSON.stringify(source)}`,
        loader: 'js'
      };
    });
  }
};

async function buildUI() {
  const result = await esbuild.build({
    entryPoints: ['src/ui.ts'],
    bundle: true,
    minify: !isWatch,
    write: false,
    format: 'iife',
    target: ['chrome58', 'firefox57', 'safari11'],
    plugins: [glslPlugin],
    logLevel: 'info'
  });

  const css = fs.readFileSync('src/styles.css', 'utf8');
  let html = fs.readFileSync('src/ui.html', 'utf8');

  html = html.replace(
    '<link rel="stylesheet" href="./styles.css">',
    `<style>\n${css}\n</style>`
  );

  const jsBundle = result.outputFiles[0].text;
  html = html.replace(
    '</body>',
    `<script>\n${jsBundle}\n</script>\n</body>`
  );

  fs.writeFileSync('ui.html', html);
  console.log('✓ Built ui.html');
}

async function buildCode() {
  await esbuild.build({
    entryPoints: ['code.ts'],
    bundle: true,
    outfile: 'code.js',
    minify: !isWatch,
    format: 'cjs',
    target: ['chrome58', 'firefox57', 'safari11'],
    logLevel: 'info'
  });
  console.log('✓ Built code.js');
}

async function build() {
  try {
    await Promise.all([buildUI(), buildCode()]);
    console.log('Build complete!');
  } catch (error) {
    console.error('Build failed:', error);
    process.exit(1);
  }
}

if (isWatch) {
  console.log('Watching for changes...');
  
  await build();

  const watchDirs = ['src', '.'];
  const watchExtensions = ['.ts', '.css', '.html', '.glsl'];
  
  for (const dir of watchDirs) {
    fs.watch(dir, { recursive: dir === 'src' }, async (eventType, filename) => {
      if (filename && watchExtensions.some(ext => filename.endsWith(ext))) {
        console.log(`\nFile changed: ${filename}`);
        await build();
      }
    });
  }
} else {
  await build();
}

