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

async function hubsToOMIAudioEmitter(doc, property, hubsComponents) {
  const extension = doc.createExtension(OMIAudioEmitterExtension);

  const audioEmitter = extension.createAudioEmitter();

  const audio = hubsComponents.getComponent("audio");

  const clip = extension.createAudioClip();
  const res = await fetch(audio.src);
  const data = await res.arrayBuffer();
  clip.setData(data);
  audioEmitter.setClip(clip);
  audioEmitter._loop = audio.loop;
  audioEmitter._autoPlay = audio.autoPlay;

  const audioParams = hubsComponents.getComponent("audio-params");
  audioEmitter._type = audioParams.audioType === "pannernode" ? "positional" : "global";
  audioEmitter._volume = audioParams.gain;
  audioEmitter._coneInnerAngle = audioParams.coneInnerAngle;
  audioEmitter._coneOuterAngle = audioParams.coneOuterAngle;
  audioEmitter._coneOuterGain = audioParams.coneOuterGain;
  audioEmitter._distanceModel = audioParams.distanceModel;
  audioEmitter._maxDistance = audioParams.maxDistance;
  audioEmitter._refDistance = audioParams.refDistance;
  audioEmitter._rolloffFactor = audioParams.rolloffFactor;

  property.setExtension(OMI_AUDIO_EMITTER, audioEmitter);
  hubsComponents.removeComponent("audio");
  hubsComponents.removeComponent("audio-params");
}