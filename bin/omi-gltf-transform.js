#!/usr/bin/env node

import fs from "fs/promises";
import path from "path";
import { NodeIO } from "@gltf-transform/core";
import { ALL_EXTENSIONS, DracoMeshCompression } from '@gltf-transform/extensions';
import draco3d from "draco3dgltf";
import { HubsComponentsExtension, OMIAudioEmitterExtension, HubsAudioComponent, HubsAudioParamsComponent, hubsToOMI } from "../src/lib.js";

// TODO: Add compress arg
const compress = false;

async function main([_node, _script, srcPath, destPath]) {
  if (srcPath) {
    srcPath = path.resolve(srcPath)
  } else {
    throw new Error("Missing src path argument.");
  }

  const stat = await fs.stat(srcPath);

  if (!stat.isFile()) {
    throw new Error("src path is not a file.");
  }

  const { ext: srcExt, name: srcName } = path.parse(srcPath);

  if (!(srcExt === ".glb" || srcExt === ".gltf")) {
    throw new Error("src path must point to a .glb or .gltf file.");
  }

  if (destPath) {
    const { ext: destExt } = path.parse(destPath);

    destPath = path.resolve(destPath);

    if (!destExt) {
      destPath = path.join(destPath, `${srcName}_out${srcExt}`);
    } else if (!(destExt === ".glb" || destExt === ".gltf")) {
      throw new Error("dest path extension must be .glb or .gltf");
    }    
  } else {
    destPath = path.join(path.dirname(srcPath), `${srcName}_out${srcExt}`);
  }

  const io = new NodeIO()
    .registerExtensions([
      ...ALL_EXTENSIONS,
      HubsComponentsExtension,
      OMIAudioEmitterExtension
    ])
    .registerDependencies({
      'draco3d.decoder': await draco3d.createDecoderModule(),
      'draco3d.encoder': await draco3d.createEncoderModule(),
      'hubs-components': [
        HubsAudioComponent,
        HubsAudioParamsComponent
      ]
    });

  const doc = io.read(srcPath);

  if (compress) {
    doc.createExtension(DracoMeshCompression)
      .setRequired(true)
      .setEncoderOptions({
          method: DracoMeshCompression.EncoderMethod.EDGEBREAKER,
          encodeSpeed: 5,
          decodeSpeed: 5,
      });
  }

  await doc.transform(hubsToOMI());

  io.write(destPath, doc);
}

main(process.argv).catch(console.error);