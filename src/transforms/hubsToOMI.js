import fetch from "isomorphic-unfetch";
import { MOZ_HUBS_COMPONENTS } from "../extensions/MOZ_hubs_components.js";
import { OMI_AUDIO_EMITTER, OMIAudioEmitterExtension } from "../extensions/OMI_audio_emitter.js";

export function hubsToOMI() {
  return async (doc) => {
    const root = doc.getRoot();
    const extensionsUsed = root.listExtensionsUsed();

    if (
      !extensionsUsed.some(
        (extension) => extension.extensionName === MOZ_HUBS_COMPONENTS
      )
    ) {
      return;
    }

    const nodes = root.listNodes();

    for (const node of nodes) {
      const hubsComponents = node.getExtension(MOZ_HUBS_COMPONENTS);

      if (!hubsComponents) {
        continue;
      }

      if (hubsComponents.hasComponent("audio") && hubsComponents.hasComponent("audio-params")) {
        await hubsToOMIAudioEmitter(doc, node, hubsComponents);
      }
    }
  };
}

const DEG2RAD = Math.PI / 180;

async function hubsToOMIAudioEmitter(doc, property, hubsComponents) {
  const extension = doc.createExtension(OMIAudioEmitterExtension);

  const audioEmitter = extension.createAudioEmitter();

  const audio = hubsComponents.getComponent("audio");

  const audioSource = extension.createAudioSource();
  const res = await fetch(audio.get("src"));
  const data = await res.arrayBuffer();
  audioSource.setData(new Uint8Array(data));
  audioEmitter.setSource(audioSource);
  audioEmitter.set("loop", audio.get("loop"));
  audioEmitter.set("playing", audio.get("autoPlay"));

  const audioParams = hubsComponents.getComponent("audio-params");
  audioEmitter.set("type", audioParams.get("audioType") === "pannernode" ? "positional" : "global");
  audioEmitter.set("gain", audioParams.get("gain"));
  audioEmitter.set("coneInnerAngle", audioParams.get("coneInnerAngle") * DEG2RAD);
  audioEmitter.set("coneOuterAngle", audioParams.get("coneOuterAngle") * DEG2RAD);
  audioEmitter.set("coneOuterGain", audioParams.get("coneOuterGain"));
  audioEmitter.set("distanceModel", audioParams.get("distanceModel"));
  audioEmitter.set("maxDistance", audioParams.get("maxDistance"));
  audioEmitter.set("refDistance", audioParams.get("refDistance"));
  audioEmitter.set("rolloffFactor", audioParams.get("rolloffFactor"));

  if (audioEmitter.get("type") === "global") {
    const scene = doc.getRoot().getDefaultScene();

    let sceneAudioEmitters = scene.getExtension(OMI_AUDIO_EMITTER);

    if (!sceneAudioEmitters) {
      sceneAudioEmitters = extension.createSceneAudioEmitters();
      scene.setExtension(OMI_AUDIO_EMITTER, sceneAudioEmitters);
    }

    sceneAudioEmitters.addAudioEmitter(audioEmitter);
  } else {
    property.setExtension(OMI_AUDIO_EMITTER, audioEmitter);
  }

  hubsComponents.removeComponent("audio");
  hubsComponents.removeComponent("audio-params");
}