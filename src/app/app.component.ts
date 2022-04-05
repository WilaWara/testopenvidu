import { Component, HostListener, OnDestroy, OnInit } from '@angular/core';
import { OpenVidu, Publisher, Session, StreamEvent, StreamManager, Subscriber } from 'openvidu-browser';
import { AuthUtils } from './Core/AuthUtils';
import { HttpClient } from '@angular/common/http';
import { UserModel } from './Core/Models/UserModels';
import { IMultimediaModels } from './Core/Models/IMultimediaModels';
import { VideocallViewMode } from 'src/app/core/models/videocallViewMode';
import { environment } from "../../src/environments/environment";

@Component({
  selector: 'app-root',
  templateUrl: './app.component.html',
  styleUrls: ['./app.component.css']
})
export class AppComponent implements OnInit, OnDestroy {

  OV: OpenVidu;
  session: Session;
  localUser: UserModel;
  subscribers: StreamManager[] = []; // Remotes
  authUtils: AuthUtils;

  mySessionId: string;
  myUserName: string;
  roomName: string;

  // Main video of the page, will be 'publisher' or one of the 'subscribers',
  // updated by click event in UserVideoComponent children
  mainStreamManager: StreamManager;

  OVScreen: any;

  sessionScreen: any;

  screensharing: boolean;
  cameraEnabled: boolean;
  audioInputEnabled: boolean;
  audioOutputEnabled: boolean;

  public videocallViewMode = VideocallViewMode;
  public currentVideocallView: number;

  cameraOptionsState: boolean;
  microphoneOptionsState: boolean;

  constructor(private httpClient: HttpClient) {
    this.OV = new OpenVidu();
    this.OVScreen = new OpenVidu();
    this.localUser = new UserModel();
    this.authUtils = new AuthUtils(httpClient);
    this.initDevices();
    this.generateParticipantInfo();
    this.screensharing = false;
    this.cameraEnabled = true;
    this.audioInputEnabled = true;
    this.audioOutputEnabled = true;
    this.mySessionId = 'SessionA';
    this.getPermissions();
    this.cameraOptionsState = false;
    this.microphoneOptionsState = false;
  }

  ngOnInit(): void {
    this.userJoinSession();
  }

  @HostListener('window:beforeunload')
  beforeunloadHandler() {
    this.destroySession();
  }

  ngOnDestroy(): void {
    this.destroyPublisher();
    this.destroySession();
  }

  private initDevices(): void {
    navigator.mediaDevices.enumerateDevices().then(
      (deviceInfos: MediaDeviceInfo[]) => {
        console.log('Available devices:', deviceInfos);
        this.localUser.setDevices(deviceInfos);
      }
    );
  }

  public setVideoDevice(deviceId): void {
    console.log('Setting video device to: ', deviceId);
    if (deviceId === 'None') {
      this.localUser.setCameraActive(false);
    } else {
      this.localUser.setCameraActive(true);
      this.localUser.setVideoSource(deviceId);
      this.destroyPublisher();
      this.initPublisher().then(publisher => {
        this.OV.session.publish(publisher);
      });
    }
  }

  public setAudioInputDevice(deviceId): void {
    console.log('Setting audio device to: ', deviceId);
    if (deviceId === 'None') {
      this.localUser.setAudioInputActive(false);
    } else {
      this.localUser.setAudioInputActive(true);
      this.localUser.setAudioInputSource(deviceId);
      this.destroyPublisher();
      this.initPublisher();
    }
  }

  public setAudioOutputDevice(groupId): void {
    console.log('Setting audio device to: ', groupId);
    if (groupId === 'None') {
      this.localUser.setAudioOutputActive(false);
    } else {
      this.localUser.setAudioOutputActive(true);
      this.localUser.setAudioOutputSource(groupId);
      this.destroyPublisher();
      this.initPublisher();
    }
  }

  private disableCamera(): void {
    (<Publisher>this.localUser.getStreamManager()).publishVideo(false);
  }

  private disableAudioInput(): void {
    (<Publisher>this.localUser.getStreamManager()).publishAudio(false);
  }

  private disableAudioOutput(): void {
    (<Publisher>this.localUser.getStreamManager()).publishAudio(false);
  }

  public userJoinScreen(): void {
    this.OVScreen = new OpenVidu();
    this.sessionScreen = this.OVScreen.initSession();

    this.sessionScreen.on('streamCreated', (event: StreamEvent) => {
      if (event.stream.typeOfVideo == "SCREEN") {
        let subscriberScreen = this.sessionScreen
          .subscribe(event.stream, 'container-screens');

        subscriberScreen.on('videoElementCreated', event => {
          this.appendUserData(event.element, subscriberScreen.stream.connection);
        });
      }
    });

    this.authUtils.getToken().then((tokenScreen) => {
      this.sessionScreen.connect(tokenScreen, { clientData: this.myUserName }).then(() => {
        console.log("Session screen connected");
      }).catch((error => {
        console.warn('There was an error connecting to the session for screen share: ', error.code, error.message);
      }));;
    });
  }

  public userJoinSession(): void {
    this.session = this.OV.initSession();
    this.session.on('streamCreated', async (event: StreamEvent) => {
      let subscriber: Subscriber = await this.session.subscribeAsync(event.stream, undefined);
      this.subscribers.push(subscriber);
    });

    this.session.on('streamJoined', async (event: StreamEvent) => {
      let subscriber: Subscriber = await this.session.subscribeAsync(event.stream, undefined);
      this.subscribers.push(subscriber);
    });

    this.session.on('streamDestroyed', (event: StreamEvent) => {
      this.deleteSubscriber(event.stream.streamManager);
    });

    this.session.on('exception', (exception) => {
      console.warn(exception);
    });

    this.authUtils.getToken().then(token => {
      this.session.connect(token, { clientData: this.myUserName })
        .then(async () => {
          let publish = await this.initPublisher();
          this.session.publish(publish);
        })
        .catch(error => {
          console.log('There was an error connecting to the session:', error.code, error.message);
        });
    });
  }

  private generateParticipantInfo(): void {
    this.myUserName = 'Participant' + Math.floor(Math.random() * 100);
  }

  private deleteSubscriber(streamManager: StreamManager): void {
    let index = this.subscribers.indexOf(streamManager, 0);
    if (index > -1) {
      this.subscribers.splice(index, 1);
    }
  }

  public updateMainStreamManager(streamManager: Publisher): void {
    this.localUser.setStreamManager(streamManager);
  }

  public publishScreenShare(): void {
    let publisherScreen = this.OVScreen.initPublisher("container-screens", { videoSource: "screen" });

    publisherScreen.once('accessAllowed', (event) => {
      this.screensharing = true;
      publisherScreen.stream.getMediaStream().getVideoTracks()[0].addEventListener('ended', () => {
        console.log('User pressed the "Stop sharing" button');
        this.screensharing = false;

        //Returning to camera stream
        this.cameraEnabled = !this.cameraEnabled;
        this.toggleCameraState();
      });
      this.localUser.setStreamManager(publisherScreen);
    });

    publisherScreen.on('videoElementCreated', function (event) {
      this.appendUserData(event.element, this.sessionScreen.connection);
      event.element['muted'] = true;
    });

    publisherScreen.once('accessDenied', (event) => {
      console.error('Screen Share: Access Denied');
    });
  }

  public appendUserData(videoElement, connection): void {
    let userData;
    let nodeId;
    if (typeof connection === "string") {
      userData = connection;
      nodeId = connection;
    } else {
      userData = JSON.parse(connection.data).clientData;
      nodeId = connection.connectionId;
    }
    let dataNode = document.createElement('div');
    dataNode.className = "data-node";
    dataNode.id = "data-" + nodeId;
    dataNode.innerHTML = "<p>" + userData + "</p>";
    videoElement.parentNode.insertBefore(dataNode, videoElement.nextSibling);
  }

  public toggleCameraState(): void {
    this.cameraEnabled = !this.cameraEnabled;
    if (this.cameraEnabled) {
      this.localUser.setCameraActive(true);
      this.localUser.setVideoSource(this.localUser.getVideoSource());
      this.destroyPublisher();
      this.initPublisher().then(publisher => {
        this.OV.session.publish(publisher);
      });
    } else {
      this.localUser.setCameraActive(false);
      this.disableCamera();
    }
  }

  public toggleAudioInputState(): void {
    this.audioInputEnabled = !this.audioInputEnabled;
    if (this.audioInputEnabled) {
      this.localUser.setAudioInputActive(true);
      this.localUser.setAudioInputSource(this.localUser.getAudioInputSource());
      this.destroyPublisher();
      this.initPublisher().then(publisher => {
        this.OV.session.publish(publisher);
      });
    } else {
      this.localUser.setAudioInputActive(false);
      this.disableAudioInput();
    }
  }

  public toggleAudioOutputState(): void {
    this.audioOutputEnabled = !this.audioOutputEnabled;
    if (this.audioOutputEnabled) {
      this.localUser.setAudioOutputActive(true);
      this.localUser.setAudioOutputSource(this.localUser.getAudioOutputSource());
      this.destroyPublisher();
      this.initPublisher().then(publisher => {
        this.OV.session.publish(publisher);
      });
    } else {
      this.localUser.setAudioOutputActive(false);
      this.disableAudioOutput();
    }
  }

  private initPublisher(): Promise<Publisher> {
    return new Promise((resolve, reject) => {
      console.log('initialize publisher');
      this.OV.initPublisherAsync(undefined, {
        audioSource: this.localUser.getAudioInputSource(),
        videoSource: this.localUser.getVideoSource(),
        publishAudio: this.localUser.isAudioInputActive(),
        publishVideo: this.localUser.isVideoActive()
      })
        .then((publisher: Publisher) => {
          this.localUser.setStreamManager(publisher);
          resolve(publisher);
        })
        .catch((error) => reject(error));
    });
  }

  private unpublishPublisher(): void {
    this.OV.session.unpublish(this.localUser.getStreamManager());
  }

  public destroySession(): void {
    if (this.session) {
      this.session.disconnect();
    }
    this.subscribers = [];
    this.localUser.deleteStreamManager();
    delete this.session;
    delete this.OV;
    parent.postMessage({ leaveRoom: true }, environment.frontendWebPath);
  }

  private destroyPublisher() {
    console.log('Destroying publisher...');
    if (this.localUser.getStreamManager() && this.localUser.getStreamManager().stream) {
      this.unpublishPublisher();
      this.localUser.getStreamManager().stream.disposeWebRtcPeer();
      this.localUser.getStreamManager().stream.disposeMediaStream();
      this.localUser.setStreamManager(null);
    }
  }

  private getPermissions() {
    this.OV.initPublisher(undefined, {
      publishAudio: true,
      publishVideo: true,
    });
  }

  public operateCameraOptions(): void {
    this.cameraOptionsState = !this.cameraOptionsState;
  }

  public operateMicrophoneOptions(): void {
    this.microphoneOptionsState = !this.microphoneOptionsState;
  }

  public goToChat(): void {

  }

  @HostListener('window:message', ['$event'])
  onMessage(event) {
    if (event.data !== undefined && event.data.room != undefined) {
      this.mySessionId = event.data.room.id;
      this.myUserName = event.data.user.name;
      this.roomName = event.data.room.name;
      this.currentVideocallView = event.data.currentVideocallView;
      if (event.data.newSession) {
        this.userJoinSession();
        this.userJoinScreen();
      }
    }

    if (event.data !== undefined && event.data.leaveRoom != undefined) {
      this.destroySession();
    }
  }
}
