
figma.showUI(__html__, { 
  width: 1200, 
  height: 800,
  themeColors: true,
  visible: true
});

// Enable plugin window resizing
figma.ui.resize(1200, 800);

interface PluginMessage {
  type: string;
  imageData?: Uint8Array;
  width?: number;
  height?: number;
  nodeId?: string;
}

let selectedNodeId: string | null = null;

function getImageFill(node: SceneNode): ImagePaint | null {
  if ('fills' in node && Array.isArray(node.fills)) {
    const imageFill = node.fills.find(
      (fill): fill is ImagePaint => fill.type === 'IMAGE' && fill.visible !== false
    );
    return imageFill || null;
  }
  return null;
}

async function getImageFromNode(node: SceneNode): Promise<{ bytes: Uint8Array; width: number; height: number } | null> {
  const imageFill = getImageFill(node);
  if (!imageFill || !imageFill.imageHash) {
    return null;
  }

  const image = figma.getImageByHash(imageFill.imageHash);
  if (!image) {
    return null;
  }

  const bytes = await image.getBytesAsync();
  const size = await image.getSizeAsync();
  
  return {
    bytes,
    width: size.width,
    height: size.height
  };
}

// Send the selected image to the UI
async function sendSelectedImage() {
  const selection = figma.currentPage.selection;
  
  if (selection.length === 0) {
    figma.ui.postMessage({ 
      type: 'no-selection',
      message: 'Please select an image or shape with an image fill.'
    });
    return;
  }

  if (selection.length > 1) {
    figma.ui.postMessage({ 
      type: 'error',
      message: 'Please select only one image at a time.'
    });
    return;
  }

  const node = selection[0];
  selectedNodeId = node.id;

  try {
    const imageData = await getImageFromNode(node);
    
    if (!imageData) {
      figma.ui.postMessage({ 
        type: 'error',
        message: 'Selected element does not contain an image. Please select an image or a shape with an image fill.'
      });
      return;
    }

    figma.ui.postMessage({
      type: 'image-data',
      imageData: imageData.bytes,
      width: imageData.width,
      height: imageData.height,
      nodeId: node.id
    });

  } catch (error) {
    figma.ui.postMessage({ 
      type: 'error',
      message: `Failed to load image: ${error instanceof Error ? error.message : 'Unknown error'}`
    });
  }
}

figma.ui.onmessage = async (msg: PluginMessage) => {
  switch (msg.type) {
    case 'get-selection':
      await sendSelectedImage();
      break;

    case 'apply-halftone':
      if (!msg.imageData || !msg.width || !msg.height) {
        figma.notify('Error: No image data received');
        return;
      }

      try {
        const newImage = figma.createImage(msg.imageData);
        
        const node = selectedNodeId ? await figma.getNodeByIdAsync(selectedNodeId) : null;
        
        if (node && 'fills' in node) {
          const fills = (node.fills as Paint[]).slice();
          const imageIndex = fills.findIndex(function(f) { return f.type === 'IMAGE'; });
          
          if (imageIndex !== -1) {
            const oldFill = fills[imageIndex] as ImagePaint;
            fills[imageIndex] = Object.assign({}, oldFill, { imageHash: newImage.hash });
            node.fills = fills;
            figma.notify('✓ Halftone effect applied!');
          }
        } else {
          const rect = figma.createRectangle();
          rect.name = 'Halftone Image';
          rect.resize(msg.width, msg.height);
          rect.fills = [{
            type: 'IMAGE',
            imageHash: newImage.hash,
            scaleMode: 'FILL'
          }];
          
          const originalNode = selectedNodeId ? await figma.getNodeByIdAsync(selectedNodeId) : null;
          if (originalNode && 'x' in originalNode && 'y' in originalNode) {
            rect.x = (originalNode.x as number) + (originalNode as RectangleNode).width + 20;
            rect.y = originalNode.y as number;
          } else {
            rect.x = figma.viewport.center.x - msg.width / 2;
            rect.y = figma.viewport.center.y - msg.height / 2;
          }
          
          figma.currentPage.appendChild(rect);
          figma.currentPage.selection = [rect];
          figma.viewport.scrollAndZoomIntoView([rect]);
          figma.notify('✓ Halftone image created!');
        }
      } catch (error) {
        figma.notify(`Error applying image: ${error instanceof Error ? error.message : 'Unknown error'}`);
      }
      break;

    case 'create-new':
      if (!msg.imageData || !msg.width || !msg.height) {
        figma.notify('Error: No image data received');
        return;
      }

      try {
        const newImage = figma.createImage(msg.imageData);
        const rect = figma.createRectangle();
        rect.name = 'Halftone Image';
        rect.resize(msg.width, msg.height);
        rect.fills = [{
          type: 'IMAGE',
          imageHash: newImage.hash,
          scaleMode: 'FILL'
        }];
        
        const originalNode = selectedNodeId ? figma.getNodeById(selectedNodeId) : null;
        if (originalNode && 'x' in originalNode && 'y' in originalNode) {
          rect.x = (originalNode.x as number) + (originalNode as RectangleNode).width + 20;
          rect.y = originalNode.y as number;
        } else {
          rect.x = figma.viewport.center.x - msg.width / 2;
          rect.y = figma.viewport.center.y - msg.height / 2;
        }
        
        figma.currentPage.appendChild(rect);
        figma.currentPage.selection = [rect];
        figma.viewport.scrollAndZoomIntoView([rect]);
        figma.notify('✓ Halftone image created!');
      } catch (error) {
        figma.notify(`Error creating image: ${error instanceof Error ? error.message : 'Unknown error'}`);
      }
      break;

    case 'cancel':
      figma.closePlugin();
      break;

    case 'resize':
      if (msg.width && msg.height) {
        figma.ui.resize(msg.width, msg.height);
      }
      break;
  }
};

figma.on('selectionchange', async () => {
  await sendSelectedImage();
});
