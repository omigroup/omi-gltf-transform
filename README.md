# OMI glTF Transform

Command line tool and node.js/browser library for transforming glTF files with OMI glTF extensions.

## Supported Extensions
- MOZ_hubs_components
  - audio
  - audio-params
- OMI_audio_emitter

## CLI Usage

Currently the CLI tool converts the audio/audio-params MOZ_hubs_components to OMI_audio_emitter. It does not support other extensions at this time.

The general use-case is to convert from a file exported from Mozilla Spoke or the Hubs Blender Addon to the OMI standard extensions.

### Ex. Convert From Exported Spoke glb to OMI glb

```
npx omi-gltf-transform ./spoke-export.glb ./omi-output.glb
```

### Ex. Convert From Exported Spoke glb to OMI gltf
```
npx omi-gltf-transform ./spoke-export.glb ./omi-output.gltf
```

## Library Usage

The following classes and functions are exported from the library and can be used in more complex gltf-transform pipelines.

### `hubsToOMI(): async (doc: Document) => void`

Transform function that converts the audio/audio-params MOZ_hubs_components to OMI_audio_emitter.

### `class OMIAudioEmitterExtension extends Extension`

Adds support for importing / exporting the OMI_audio_emitter extension.

### `class OMISceneAudioEmitters extends ExtensionProperty`

### `class OMIAudioEmitter extends ExtensionProperty`

### `class OMIAudioSource extends ExtensionProperty`

### `class HubsComponentsExtension extends Extension`

Adds support for importing / exporting the following components of the MOZ_hubs_components extension:

- audio
- audio-params

### `class HubsComponents extends ExtensionProperty`

### `class HubsComponent`

### `class HubsAudioComponent extends HubsComponent`

### `class HubsAudioParamsComponent extends HubsComponent`