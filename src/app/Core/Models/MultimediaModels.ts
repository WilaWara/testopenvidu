import { IMultimediaModels } from "./IMultimediaModels";

export class MultimediaModels implements IMultimediaModels {

    public kind: string;
    public deviceId: string;
    public label: string;

    constructor(deviceId: string) {
        this.kind = deviceId;
    }
}
