
function getTime(){
    return performance.now()/1000;
}


export default class Time{
    startTime = null;
    nowTime = null;
    lastUpdate = null;
    interval = null;

    static STATE = {start:1, stop:0,};
    state = Time.STATE.start;    // stop

    get ElapsedTime(){ // since start
        return this.Now-this.startTime;
    }
    get Interval(){ //since last update
        return this.interval??0; //0.01666
        // return 0.01666;
    }

    get FPS(){
        return 1/this.interval;
    }

    get Now(){
        if(this.state & Time.STATE.start)
            this.nowTime = getTime();
        return this.nowTime;
    }

    start(){

        this.startTime = this.lastUpdate =this.Now;
        this.state |= Time.STATE.start;
    }
    stop(){
        this.state &= ~Time.STATE.start;
        this.interval = 0;
    }

    update(){
        if(!(this.state & Time.STATE.start))
            return;


        const now = this.Now;
        this.interval = now - this.lastUpdate;
        this.lastUpdate = now;

    }
}
