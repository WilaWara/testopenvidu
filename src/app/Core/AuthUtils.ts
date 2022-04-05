import { HttpHeaders, HttpClient } from "@angular/common/http";
import { throwError as observableThrowError } from 'rxjs';
import { catchError } from 'rxjs/operators';
import { Injectable } from '@angular/core';

@Injectable({
    providedIn: 'root'
})

export class AuthUtils {

    OPENVIDU_SERVER_URL = 'https://webrtc.ses-unit.com';
    OPENVIDU_SERVER_SECRET = 'KdUg4x4cRXsR9STk9qMqvBHr4RXL7LrP';
    SESSION_ID = 'SessionScreenA';

    constructor(private httpClient: HttpClient) { }

    public getToken(): Promise<string> {
        return this.createSession(this.SESSION_ID).then(
            sessionId => {
                return this.createToken(sessionId);
            })
    }

    public createToken(sessionId): Promise<string> {
        return new Promise((resolve, reject) => {
            let body = {};
            let options = {
                headers: new HttpHeaders({
                    'Authorization': 'Basic ' + btoa('OPENVIDUAPP:' + this.OPENVIDU_SERVER_SECRET),
                    'Content-Type': 'application/json'
                })
            };
            return this.httpClient.post(this.OPENVIDU_SERVER_URL + '/openvidu/api/sessions/' + sessionId + '/connection', body, options)
                .pipe(
                    catchError(error => {
                        reject(error);
                        return observableThrowError(error);
                    })
                )
                .subscribe(response => {
                    resolve(response['token']);
                });
        });
    }

    public createSession(sessionId) {
        return new Promise((resolve, reject) => {
            let body = JSON.stringify({ customSessionId: sessionId });
            let options = {
                headers: new HttpHeaders({
                    'Authorization': 'Basic ' + btoa('OPENVIDUAPP:' + this.OPENVIDU_SERVER_SECRET),
                    'Content-Type': 'application/json'
                })
            };
            return this.httpClient.post(this.OPENVIDU_SERVER_URL + '/openvidu/api/sessions', body, options)
                .pipe(
                    catchError(error => {
                        console.log(error);
                        if (error.status === 409) {
                            resolve(sessionId);
                        } else {
                            console.warn('No connection to OpenVidu Server. This may be a certificate error at ' + this.OPENVIDU_SERVER_URL);
                            if (window.confirm('No connection to OpenVidu Server. This may be a certificate error at \"' + this.OPENVIDU_SERVER_URL +
                                '\"\n\nClick OK to navigate and accept it. If no certificate warning is shown, then check that your OpenVidu Server' +
                                'is up and running at "' + this.OPENVIDU_SERVER_URL + '"')) {
                                location.assign(this.OPENVIDU_SERVER_URL + '/accept-certificate');
                            }
                        }
                        return observableThrowError(error);
                    })
                )
                .subscribe(response => {
                    resolve(response['id']);
                });
        });
    }
}
