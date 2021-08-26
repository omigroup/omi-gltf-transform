import {
  COPY_IDENTITY,
  Extension,
  ExtensionProperty,
  GraphChild,
  PropertyType,
  Format
} from "@gltf-transform/core";

export const OMI_AUDIO_EMITTER = "OMI_audio_emitter";

export class OMIAudioEmitterExtension extends Extension {
  static EXTENSION_NAME = OMI_AUDIO_EMITTER;

  extensionName = OMIAudioEmitterExtension.EXTENSION_NAME;

  createAudioEmitter() {
    return new OMIAudioEmitter(this.doc.getGraph(), this);
  }

  createAudioClip() {
    return new OMIAudioClip(this.doc.getGraph(), this);
  }

  // TODO: Read OMI_audio_emitter
  read() {}

  write(context) {
    if (this.properties.size === 0) {
      return this;
    }

    const { json } = context.jsonDoc;

    const audioClips = Array.from(this.properties).filter(
      (property) => property.propertyType === "OMIAudioClip"
    );
    const audioClipDefs = [];
    const audioClipIndexMap = new Map();

    let audioClipIndex = 0;

    for (const audioClip of audioClips) {
      const audioSource = {
        mimeType: "audio/mpeg",
      };

      if (context.options.format === Format.GLB) {
        const buffer = this.doc.getRoot().listBuffers()[0];

        if (!context.otherBufferViews.has(buffer)) {
          context.otherBufferViews.set(buffer, []);
        }

        context.otherBufferViews.get(buffer).push(audioClip._data);

        audioSource.bufferView = json.bufferViews.length;
        json.bufferViews.push({
          buffer: 0,
          byteOffset: -1, // determined while iterating buffers, in Writer.ts.
          byteLength: audioClip._data.byteLength,
        });
      } else {
        const uri = `${context.options.basename}_audio${audioClipIndex++}.mp3`;
        context.jsonDoc.resources[uri] = audioClip._data;
        audioSource.uri = uri;
      }

      const audioClipDef = {
        sources: [audioSource],
      };
      audioClipDefs.push(audioClipDef);
      audioClipIndexMap.set(audioClip, audioClipDefs.length - 1);
    }

    const audioEmitters = Array.from(this.properties).filter(
      (property) => property.propertyType === "OMIAudioEmitter"
    );
    const audioEmitterDefs = [];
    const audioEmitterIndexMap = new Map();

    for (const audioEmitter of audioEmitters) {
      const clip = audioClips.findIndex(
        (clip) => audioEmitter.clip.getChild() === clip
      );

      if (clip === -1) {
        throw new Error("Error getting clip index");
      }

      const audioEmitterDef = {
        type: audioEmitter._type,
        volume: audioEmitter._volume,
        loop: audioEmitter._loop,
        autoPlay: audioEmitter._autoPlay,
        muted: audioEmitter._muted,
        coneInnerAngle: audioEmitter._coneInnerAngle,
        coneOuterAngle: audioEmitter._coneOuterAngle,
        coneOuterGain: audioEmitter._coneOuterGain,
        distanceModel: audioEmitter._distanceModel,
        maxDistance: audioEmitter._maxDistance,
        refDistance: audioEmitter._refDistance,
        rolloffFactor: audioEmitter._rolloffFactor,
        clip,
      };
      audioEmitterDefs.push(audioEmitterDef);
      audioEmitterIndexMap.set(audioEmitter, audioEmitterDefs.length - 1);
    }

    const root = this.doc.getRoot();

    root.listNodes().forEach((node) => {
      const nodeIndex = context.nodeIndexMap.get(node);
      const nodeDef = json.nodes[nodeIndex];

      const audioEmitter = node.getExtension(OMI_AUDIO_EMITTER);

      if (!audioEmitter) {
        return;
      }

      nodeDef.extensions = nodeDef.extensions || {};

      nodeDef.extensions[OMI_AUDIO_EMITTER] = {
        audioEmitter: audioEmitterIndexMap.get(audioEmitter),
      };
    });

    json.extensions = json.extensions || {};

    json.extensions[OMI_AUDIO_EMITTER] = {
      audioClips: audioClipDefs,
      audioEmitters: audioEmitterDefs,
    };

    return this;
  }
}

export class OMIAudioEmitter extends ExtensionProperty {
  static EXTENSION_NAME = OMI_AUDIO_EMITTER;

  propertyType = "OMIAudioEmitter";
  parentTypes = [PropertyType.SCENE, PropertyType.NODE];
  extensionName = OMI_AUDIO_EMITTER;

  _type = "positional";
  _volume = 1;
  _loop = false;
  _autoPlay = false;
  _muted = false;
  _coneInnerAngle = Math.PI * 2;
  _coneOuterAngle = Math.PI * 2;
  _coneOuterGain = 0;
  _distanceModel = "inverse";
  _maxDistance = 10000;
  _refDistance = 1;
  _rolloffFactor = 1;

  constructor(graph, extension) {
    super(graph, extension);
    this.clip = GraphChild(this, "clip");
  }

  setClip(clip) {
    this.clip = this.graph.link("clip", this, clip);
    return this;
  }

  copy(other, resolve = COPY_IDENTITY) {
    super.copy(other, resolve);

    this._type = other._type;
    this._volume = other._volume;
    this._loop = other._loop;
    this._autoPlay = other._autoPlay;
    this._muted = other._muted;
    this._coneInnerAngle = other._coneInnerAngle;
    this._coneOuterAngle = other._coneOuterAngle;
    this._coneOuterGain = other._coneOuterGain;
    this._distanceModel = other._distanceModel;
    this._maxDistance = other._maxDistance;
    this._refDistance = other._refDistance;
    this._rolloffFactor = other._rolloffFactor;

    this.setClip(other.clip ? resolve(other.clip.getChild()) : null);

    return this;
  }
}

export class OMIAudioClip extends ExtensionProperty {
  static EXTENSION_NAME = OMI_AUDIO_EMITTER;
  propertyType = "OMIAudioClip";
  // TODO: Should we also be able to place these on the root?
  parentTypes = ["OMIAudioEmitter"];
  extensionName = OMI_AUDIO_EMITTER;

  setData(data) {
    this._data = data;
    return this;
  }

  copy(other, resolve = COPY_IDENTITY) {
    super.copy(other, resolve);

    // TODO: clone array buffer?
    this._data = other._data;

    return this;
  }
}
