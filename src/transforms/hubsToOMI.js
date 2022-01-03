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
  const res = await fetch(audio.src);
  const data = await res.arrayBuffer();
  audioSource.setData(data);
  audioEmitter.setSource(audioSource);
  audioEmitter._loop = audio.loop;
  audioEmitter._playing = audio.autoPlay;

  const audioParams = hubsComponents.getComponent("audio-params");
  audioEmitter._type = audioParams.audioType === "pannernode" ? "positional" : "global";
  audioEmitter._gain = audioParams.gain;
  audioEmitter._coneInnerAngle = audioParams.coneInnerAngle * DEG2RAD;
  audioEmitter._coneOuterAngle = audioParams.coneOuterAngle * DEG2RAD;
  audioEmitter._coneOuterGain = audioParams.coneOuterGain;
  audioEmitter._distanceModel = audioParams.distanceModel;
  audioEmitter._maxDistance = audioParams.maxDistance;
  audioEmitter._refDistance = audioParams.refDistance;
  audioEmitter._rolloffFactor = audioParams.rolloffFactor;

  if (audioEmitter._type === "global") {
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