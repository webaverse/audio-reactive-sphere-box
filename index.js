/* eslint-disable arrow-parens */
/* eslint-disable semi */
/* eslint-disable object-curly-spacing */
/* eslint-disable linebreak-style */
import metaversefile from 'metaversefile'
import * as THREE from 'three'
import { EXRLoader } from 'three/examples/jsm/loaders/EXRLoader.js'

import SpatialAudio from './audio/index.js'

import {
  masterPieceParticlesFragment,
  masterPieceParticlesVertex,
} from './shaders/masterPieceParticles.js'
import {
  roomFragment,
  roomVertex,
  roomWireframeFragment,
} from './shaders/room.js'
import { sphereFragment, sphereVertex } from './shaders/sphere.js'

const { useApp, useLoaders, useFrame, useCleanup, usePhysics, useInternals } =
  metaversefile

const baseUrl = import.meta.url.replace(/(\/)[^\/\/]*$/, '$1')

let physicsIds = []
let passesIds = []
let emasiveArray = []
let neonClubEmissiveMaterial
let neonClubCyberLinesMaterial
let cloudGeo
let cloudMaterial1
let cloudMaterial2
let cloudMaterial3
let cloudMaterial4
let cloudParticles1 = []
let cloudParticles2 = []
let cloudParticles3 = []
let cloudParticles4 = []
let beatFactor1
let beatFactor2
let beatFactor3
let beatFactor4
let elapsedTime
let pulseAnimation = false
let pulseNumber = -2
let pulseNumber2 = -2
let audio
let audioPosition = { x: 0, y: 0, z: 0 }
let audioRotation = { x: 0, y: 0, z: 0 }
// let rotationAnimation = false
// let lastRotationNumber = 0

export default (e) => {
  const app = useApp()
  app.name = 'neon-club'
  const camera = useInternals().camera
  const gl = useInternals().renderer
  const physics = usePhysics()
  gl.outputEncoding = THREE.sRGBEncoding
  const disposeMaterial = (obj) => {
    if (obj.material) {
      obj.material.dispose()
    }
  }
  app.traverse(disposeMaterial)
  const loadModel = (params) => {
    return new Promise((resolve, reject) => {
      const { gltfLoader } = useLoaders()
      const { dracoLoader } = useLoaders()
      gltfLoader.setDRACOLoader(dracoLoader).setCrossOrigin('anonymous')

      gltfLoader.load(params.filePath + params.fileName, (gltf) => {
        gltf.scene.traverse((child) => {})
        const physicsId = physics.addGeometry(gltf.scene)
        physicsIds.push(physicsId)
        // gltf.scene.position.set(0, 0, 0)
        // gltf.scene.rotation.set(Math.PI, 0, 0)
        // gltf.scene.updateMatrixWorld()
        resolve(gltf.scene)
      })
    })
  }

  // sky
  const pmremGenerator = new THREE.PMREMGenerator(gl)
  pmremGenerator.compileEquirectangularShader()

  new EXRLoader()
    // .setDataType(THREE.UnsignedByteType)
    .load(baseUrl + '/exr/kloppenheim.exr', function (texture) {
      let t = pmremGenerator.fromEquirectangular(texture).texture
      t.minFilter = THREE.LinearFilter
      // rootScene.background = t
      texture.dispose()
    })

  const masterPieceGeometry = new THREE.BoxBufferGeometry(30, 7, 7, 20, 20, 20)
  const masterPieceMaterial = new THREE.ShaderMaterial({
    vertexShader: masterPieceParticlesVertex,
    fragmentShader: masterPieceParticlesFragment,
    depthWrite: false,
    blending: THREE.AdditiveBlending,
    vertexColors: true,
    // wireframe:true,
    transparent: true,
    // side: THREE.DoubleSide,
    uniforms: {
      uTime: { value: 0 },
      uBeat: { value: 0.5 },
      uMood: { value: new THREE.Vector3(1, 1, 1) },
      uResolution: {
        value: new THREE.Vector2(window.innerWidth, window.innerHeight),
      },
      uTexture: { value: null },
      uSize: { value: 4 * gl.getPixelRatio() },
    },
  })

  const masterPiece = new THREE.Points(masterPieceGeometry, masterPieceMaterial)
  // const wireframe = new THREE.LineSegments(
  //   masterPieceGeometry,
  //   masterPieceMaterial
  // )
  // masterPiece.add(wireframe)
  masterPiece.scale.set(0.92, 0.92, 0.92)
  masterPiece.position.set(0, 2.5, 0)
  masterPiece.rotation.x = Math.PI / 2
  masterPiece.updateMatrixWorld()

  app.add(masterPiece)

  // const roomGeometry = new THREE.BoxBufferGeometry(30, 5, 5, 100, 100, 100)
  const roomGeometry = new THREE.CylinderBufferGeometry(5, 5, 30, 4, 1000, true)
  const roomWireframeGeometry = new THREE.BoxBufferGeometry(
    30,
    7,
    7,
    20,
    20,
    20
  )
  const roomMaterial = new THREE.ShaderMaterial({
    vertexShader: roomVertex,
    fragmentShader: roomFragment,
    // depthWrite: false,
    // blending: THREE.AdditiveBlending,
    vertexColors: true,
    // wireframe:true,
    // transparent: true,
    side: THREE.BackSide,
    uniforms: {
      uTime: { value: 0 },
      uPulse: { value: -2 },
      uPulse2: { value: -2 },
      uBeat: { value: 0.5 },
      uMood: { value: new THREE.Vector3(0.1, 0.2, 0.6) },
      uResolution: {
        value: new THREE.Vector2(window.innerWidth, window.innerHeight),
      },
      uTexture: { value: null },
      // uSize: { value: 4 * gl.getPixelRatio() },
    },
  })
  const roomWireframeMaterial = new THREE.ShaderMaterial({
    vertexShader: roomVertex,
    fragmentShader: roomWireframeFragment,
    // depthWrite: false,
    // blending: THREE.AdditiveBlending,
    vertexColors: true,
    // wireframe:true,
    transparent: true,
    side: THREE.BackSide,
    uniforms: {
      uTime: { value: 0 },
      uBeat: { value: 0.5 },
      uMood: { value: new THREE.Vector3(0.1, 0.2, 0.6) },
      uResolution: {
        value: new THREE.Vector2(window.innerWidth, window.innerHeight),
      },
      uTexture: { value: null },
      // uSize: { value: 4 * gl.getPixelRatio() },
    },
  })

  const room = new THREE.Mesh(roomGeometry, roomMaterial)

  room.rotation.z += Math.PI / 2
  room.rotation.x += Math.PI / 4
  // room.rotation.y += Math.PI / 4
  room.position.set(0, 2.5, 0)
  room.updateMatrixWorld()
  const ground = new THREE.Mesh(
    new THREE.PlaneGeometry(100, 100),
    new THREE.MeshBasicMaterial()
  )
  ground.rotation.x -= Math.PI / 2
  ground.position.y--
  const groundPhysicsId = physics.addGeometry(ground)
  physicsIds.push(groundPhysicsId)
  const wireframe = new THREE.LineSegments(
    roomWireframeGeometry,
    roomWireframeMaterial
  )
  // wireframe.scale.set(0.999, 0.999, 0.999)
  wireframe.position.set(0, 2.5, 0)
  wireframe.updateMatrixWorld()
  room.add(wireframe)
  app.add(room)

  const sphere = new THREE.Mesh(
    new THREE.SphereBufferGeometry(2.5, 1000, 1000),
    new THREE.ShaderMaterial({
      vertexShader: sphereVertex,
      fragmentShader: sphereFragment,
      // depthWrite: false,
      // blending: THREE.AdditiveBlending,
      vertexColors: true,
      // wireframe:true,
      // transparent: true,
      // side: THREE.BackSide,
      uniforms: {
        uTime: { value: 0 },
        uPulse: { value: -2 },
        uPulse2: { value: -2 },
        uBeat: { value: 0.5 },
        uMood: { value: new THREE.Vector3(0.1, 0.2, 0.6) },
        uResolution: {
          value: new THREE.Vector2(window.innerWidth, window.innerHeight),
        },
        uTexture: { value: null },
        // uSize: { value: 4 * gl.getPixelRatio() },
      },
    })
  )
  sphere.position.set(7, 2, 0)
  sphere.rotation.y = Math.PI
  sphere.updateMatrixWorld()

  app.add(sphere)

  console.log(sphere)

  new THREE.TextureLoader().load(baseUrl + 'textures/smoke.png', (texture) => {
    cloudGeo = new THREE.PlaneBufferGeometry(4, 4)
    cloudMaterial1 = new THREE.MeshLambertMaterial({
      map: texture,
      transparent: true,
      // side: THREE.BackSide,
      blending: THREE.AdditiveBlending,
      depthWrite: false,
      color: '#535d6a',
    })
    cloudMaterial2 = new THREE.MeshLambertMaterial({
      map: texture,
      transparent: true,
      // side: THREE.BackSide,
      blending: THREE.AdditiveBlending,
      depthWrite: false,
      color: '#535d6a',
    })
    cloudMaterial3 = new THREE.MeshLambertMaterial({
      map: texture,
      transparent: true,
      // side: THREE.BackSide,
      blending: THREE.AdditiveBlending,
      depthWrite: false,
      color: '#535d6a',
    })
    cloudMaterial4 = new THREE.MeshLambertMaterial({
      map: texture,
      transparent: true,
      // side: THREE.BackSide,
      blending: THREE.AdditiveBlending,
      depthWrite: false,
      color: '#535d6a',
    })
    const addClouds = (pos, material, array) => {
      for (let p = 0; p < 30; p++) {
        const cloud = new THREE.Mesh(cloudGeo, material)
        cloud.position.set(Math.random() * 2 - 1, 12.5, Math.random() * 2 - 2)
        cloud.position.x += pos[0]
        cloud.position.y += pos[1]
        cloud.position.z += pos[2]
        // cloud.rotation.y += Math.PI / 2
        // cloud.rotation.y = -0.12
        // cloud.rotation.x = 1.16
        cloud.rotation.z = Math.random() * 2 * Math.PI
        cloud.material.opacity = 0.4
        array.push(cloud)
        cloud.updateMatrixWorld()
        // app.add(cloud)
      }
    }
    addClouds([0, -11, -6], cloudMaterial1, cloudParticles1)
    addClouds([0.2, -11, -7], cloudMaterial2, cloudParticles2)
    // addClouds([40, -20, 45], cloudMaterial3, cloudParticles3)
    // addClouds([-50, -25, 34], cloudMaterial4, cloudParticles4)
  })

  // drag and dropping audio file
  document.body.ondrop = (e) => {
    console.log('File(s) dropped')

    // Prevent default behavior (Prevent file from being opened)
    e.preventDefault()

    if (e.dataTransfer.items) {
      // Use DataTransferItemList interface to access the file(s)
      for (var i = 0; i < e.dataTransfer.items.length; i++) {
        // If dropped items aren't files, reject them
        if (e.dataTransfer.items[i].kind === 'file') {
          const file = e.dataTransfer.items[i].getAsFile()
          const fileReader = new FileReader()
          fileReader.readAsArrayBuffer(file)
          fileReader.onload = function (e) {
            const blob = new Blob([e.target.result], { type: 'audio/mp3' })
            const url = window.URL.createObjectURL(blob)
            audio = new SpatialAudio(url, app, camera, true)
            audio.track.play()
            console.log(
              "Filename: '" + file.name + "'",
              '(' + Math.floor((file.size / 1024 / 1024) * 100) / 100 + ' MB)'
            )
          }
        }
      }
    } else {
      // Use DataTransfer interface to access the file(s)
      for (var i = 0; i < e.dataTransfer.files.length; i++) {
        console.log(
          '... file[' + i + '].name = ' + e.dataTransfer.files[i].name
        )
      }
    }
  }

  // creating audio with space bar click

  document.body.onkeyup = (e) => {
    if (e.code === 'KeyM') {
      if (!audio) {
        audio = new SpatialAudio(
          baseUrl + 'tracks/music1.mp3',
          app,
          camera,
          true
        )
        audio.updateAudio({
          position: audioPosition,
          rotation: audioRotation,
        })
      }
      if (audio.track.paused !== undefined) {
        if (audio.track.paused) {
          audio.track.play()
        } else {
          audio.track.pause()
        }
      }
    }
  }

  const updateClouds = (array, rotation, beatFactor) => {
    array.forEach((cloud) => {
      cloud.rotation.z *= 1 + beatFactor / 1000
      const randomPosition =
        Math.round(Math.abs(beatFactor - Math.random() / 2) * 10) / 10
      if (cloud.position.y + randomPosition > 7) {
        cloud.position.y = 1
      } else {
        cloud.position.y += randomPosition
      }

      cloud.rotation.z += rotation
      cloud.updateMatrixWorld()
      const opacityBasedOnPosition = (3.5 - cloud.position.y / 2) / 10
      // console.log(opacityBasedOnPosition)
      cloud.material.opacity = opacityBasedOnPosition
    })
  }

  useFrame(({ timestamp }) => {
    elapsedTime = timestamp
    if (audio) {
      // spatial audio position
      // audioRotation.y += 0.01
      audio.updateAudio({
        position: audioPosition,
        rotation: audioRotation,
      })
      const threshold = audio.getThreshold()
      audio.updateMoodArray()
      audio.logMood()
      masterPiece.material.uniforms.uTime.value = elapsedTime
      room.material.uniforms.uTime.value = elapsedTime * 10
      sphere.material.uniforms.uTime.value = elapsedTime * 10

      wireframe.material.uniforms.uTime.value = elapsedTime
      if (pulseAnimation) {
        if (pulseNumber >= 2) {
          pulseNumber = -2
          pulseNumber2 = -2
          pulseAnimation = false
        } else {
          pulseNumber += 0.01
          pulseNumber2 += 0.01
          room.material.uniforms.uPulse.value = pulseNumber
          room.material.uniforms.uPulse2.value = pulseNumber2
        }
      }

      const moodChanger = threshold / 255
      const moodChangerColor = [
        moodChanger + 0.1 + (beatFactor3 ? beatFactor3 / 50 : 0),
        0.3 + moodChanger / 10 + (beatFactor2 ? beatFactor2 / 40 : 0),
        Math.abs(0.8 - moodChanger) + (beatFactor1 ? beatFactor1 / 30 : 0),
      ]
      const moodChangerColor1 = [
        Math.abs(0.8 - moodChanger),
        moodChanger + 0.1,
        0.3 + moodChanger / 10,
      ]
      masterPiece.material.uniforms.uMood.value = new THREE.Vector3(
        ...moodChangerColor1
      )
      room.material.uniforms.uMood.value = new THREE.Vector3(
        ...moodChangerColor1
      )
      sphere.material.uniforms.uMood.value = new THREE.Vector3(
        ...moodChangerColor1
      )
      wireframe.material.uniforms.uMood.value = new THREE.Vector3(
        moodChangerColor1[2],
        moodChangerColor1[0],
        moodChangerColor1[1]
      )
      if (beatFactor1) {
        cloudMaterial1.color = new THREE.Color(...moodChangerColor)
        room.material.uniforms.uBeat.value = beatFactor1
        sphere.material.uniforms.uBeat.value = beatFactor1
        masterPiece.material.uniforms.uBeat.value = beatFactor1
        // if (rotationAnimation) {
        //   if (masterPiece.rotation.x - lastRotationNumber >= Math.PI / 2) {
        //     rotationAnimation = false
        //     lastRotationNumber = masterPiece.rotation.x
        //   } else {
        //     masterPiece.rotation.x += beatFactor1 / 100
        //     masterPiece.updateMatrixWorld()
        //   }
        // }
        // if (beatFactor1 >= 0.5) {
        //   rotationAnimation = true
        // }
        // masterPiece.rotation.x += beatFactor1/10
        masterPiece.updateMatrixWorld()
        updateClouds(cloudParticles1, -0.00035, beatFactor1)
      }
      if (beatFactor2) {
        cloudMaterial2.color = new THREE.Color(...moodChangerColor1)
        updateClouds(cloudParticles2, -0.0004, beatFactor1)
      }
      if (beatFactor3) {
        // pulse
        if (beatFactor3 >= 0.9) {
          console.log(beatFactor3)
          pulseAnimation = true
        }
      }
      // if (beatFactor2) {
      //   cloudMaterial2.color = new THREE.Color(
      //     (moodChangerColor[1] + beatFactor2 / 22) / 5,
      //     (moodChangerColor[0] + beatFactor2 / 30) / 5,
      //     (moodChangerColor[2] + beatFactor2 / 30) / 5
      //   )
      // }
      // if (beatFactor3) {
      //   cloudMaterial3.color = new THREE.Color(
      //     (moodChangerColor[0] - beatFactor3 / 30) / 5,
      //     (moodChangerColor[1] + beatFactor3 / 25) / 5,
      //     (moodChangerColor[2] + beatFactor3 / 30) / 5
      //   )
      // }
      // if (beatFactor4) {
      //   cloudMaterial4.color = new THREE.Color(
      //     (moodChangerColor[0] - beatFactor4 / 30) / 5,
      //     (moodChangerColor[1] + beatFactor4 / 24) / 5,
      //     (moodChangerColor[2] + beatFactor4 / 32) / 5
      //   )
      // }

      // updateClouds(cloudParticles2, 0.0004, beatFactor2)
      // updateClouds(cloudParticles3, 0.00025, beatFactor3)
      // updateClouds(cloudParticles4, -0.0003, beatFactor4)
      // directionalLight.color = new THREE.Color(...moodChangerColor)
      // console.log(moodChanger)

      beatFactor1 = audio.getFrequenciesByRange({
        horizontalRangeStart: 40,
        horizontalRangeEnd: 48,
        verticalRangeStart: 0,
        verticalRangeEnd: 255,
      })
      beatFactor2 = audio.getFrequenciesByRange({
        horizontalRangeStart: 85,
        horizontalRangeEnd: 93,
        verticalRangeStart: 15,
        verticalRangeEnd: 40,
      })
      beatFactor3 = audio.getFrequenciesByRange({
        horizontalRangeStart: 3,
        horizontalRangeEnd: 10,
        verticalRangeStart: 0,
        verticalRangeEnd: 255,
      })
      beatFactor4 = audio.getFrequenciesByRange({
        horizontalRangeStart: 140,
        horizontalRangeEnd: 148,
        verticalRangeStart: 80,
        verticalRangeEnd: 100,
      })

      // console.log(beatFactor3)
    }
  })
  useCleanup(() => {
    for (const physicsId of physicsIds) {
      physics.removeGeometry(physicsId)
    }
  })

  return app
}
