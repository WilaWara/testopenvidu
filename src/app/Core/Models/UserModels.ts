import { Publisher, StreamManager } from 'openvidu-browser';
import { IMultimediaModels } from './IMultimediaModels';

export class UserModel {
    private type: 'local' | 'remote';
    private avatar: string;
    private audioInputActive: boolean;
    private audioOutputActive: boolean;
    private videoActive: boolean;
    private audioInputSource: IMultimediaModels[];
    private audioOutputSource: IMultimediaModels[];
    private videoSource: IMultimediaModels[];
    public videoSourceId: string;
    public audioInputSourceId: string;
    public audioOutputSourceId: string;

    streamManager: Publisher;
    connectionId: string;

    constructor() {
        this.connectionId = '';
        this.streamManager = null;
        this.type = 'local';
        this.audioInputActive = true;
        this.audioOutputActive = true;
        this.videoActive = true;
        this.audioInputSource = new Array<IMultimediaModels>();
        this.audioOutputSource = new Array<IMultimediaModels>();
        this.videoSource = new Array<IMultimediaModels>();
        this.audioInputSourceId = '';
        this.audioOutputSourceId = '';
        this.videoSourceId = '';
    }

    public getConnectionId(): string {
        return this.connectionId;
    }

    public getStreamManager(): Publisher {
        return this.streamManager;
    }

    public deleteStreamManager(): void {
        delete this.streamManager;
    }

    public isLocal(): boolean {
        return this.type === 'local';
    }

    public isRemote(): boolean {
        return !this.isLocal();
    }

    public getAvatar(): string {
        return this.avatar;
    }

    public isAudioInputActive(): boolean {
        return this.audioInputActive;
    }

    public isAudioOutputActive(): boolean {
        return this.audioOutputActive;
    }

    public isVideoActive(): boolean {
        return this.videoActive;
    }

    public getAudioInputSources(): IMultimediaModels[] {
        return this.audioInputSource;
    }

    public getAudioOutputSources(): IMultimediaModels[] {
        return this.audioOutputSource;
    }

    public getVideoSources(): IMultimediaModels[] {
        return this.videoSource;
    }

    public getVideoSource(): string {
        return this.videoSourceId;
    }

    public getAudioInputSource(): string {
        return this.audioInputSourceId;
    }

    public getAudioOutputSource(): string {
        return this.audioInputSourceId;
    }

    public setStreamManager(streamManager: Publisher) {
        this.streamManager = streamManager;
    }

    public setDevices(devices: any[]): void {
        devices.forEach((device: any) => {
            switch (device.kind) {
                case 'audioinput':
                    this.audioInputSource.push(device);
                    if (this.audioInputSourceId === '') {
                        this.audioInputSourceId = device.deviceId;
                    }
                    break;
                case 'audiooutput':
                    this.audioOutputSource.push(device);
                    if (this.audioOutputSourceId === '') {
                        this.audioOutputSourceId = device.groupId;
                    }
                    break;
                case 'videoinput':
                    this.videoSource.push(device);
                    if (this.videoSourceId === '') {
                        this.videoSourceId = device.deviceId;
                    }
            }
        });
    }

    public setConnectionId(conecctionId: string) {
        this.connectionId = conecctionId;
    }

    public setType(type: 'local' | 'remote') {
        this.type = type;
    }

    public setUserAvatar(avatar: string): void {
        this.avatar = avatar;
    }

    public setAudioInputActive(isAudioActive: boolean) {
        this.audioInputActive = isAudioActive;
    }

    public setAudioOutputActive(isAudioActive: boolean) {
        this.audioOutputActive = isAudioActive;
    }

    public setCameraActive(isVideoActive: boolean) {
        this.videoActive = isVideoActive;
    }

    public setVideoSource(videoSourceId: string) {
        this.videoSourceId = videoSourceId;
    }

    public setAudioInputSource(audioSourceId: string) {
        this.audioInputSourceId = audioSourceId;
    }

    public setAudioOutputSource(audioSourceId: string) {
        this.audioOutputSourceId = audioSourceId;
    }
}
