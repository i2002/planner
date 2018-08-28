// __________ Review __________
class Review {
    constructor() {
        document.querySelector(".card.review .buttons .return").addEventListener("click", this.return);
        document.querySelector(".card.review .buttons .finish").addEventListener("click", this.finish);
    }

    finish() {
        // get completed tasks
        let tasks = aplicatie.tasks.completed;
        let note = document.querySelector(".card.review .content textarea").value;
        document.querySelector(".card.review .content textarea").value = "";
        let data = {tasks, note};
        
        // get day
        let now = new Date(Date.now());
        let date = `${now.getFullYear()}-${(now.getMonth() + 1).toString().padStart(2, "0")}-${now.getDate().toString().padStart(2, "0")}`;

        //save day's review
        let session = 1;
        while(localStorage.getItem(`${date}_${session}`)) {
            session++;
        }
        localStorage.setItem(`${date}_${session}`, JSON.stringify(data));
        localStorage.removeItem("session");

        aplicatie.quit();
    }

    return() {
        if(aplicatie.settings.pomodoro.fixed_nr && aplicatie.settings.pomodoro.max_pomodoro_per_day != -1) {
            if(aplicatie.pomodoro.nr < 1) {
                aplicatie.gui.popup.show("Planned time has ended. Restart the app for a new session.");
                return;
            }
        }
        
        aplicatie.changeState("work");
    }
}