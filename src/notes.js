// __________ Notes - Controller __________
class Notes {
    constructor(data) {
        this.list = new Map();
        this.list.set("maxId", -1);

        this.order = [];
        this.view = new NotesView(this);

        if (data) {
            data.forEach(item => this.add(item));
        }
    }

    // Callbacks
    // - for item
    callback(e) {
        let element;
        for(element = e.target; element.tagName != "html" && element.id.slice(0,4) != "note"; element = element.parentNode);
        let item = aplicatie.notes.list.get(parseInt(element.id.slice(5)));

        let className;
        for(element = e.target; element.tagName.toLowerCase() != "html"; element = element.parentNode) {
            ["edit","remove"].forEach(classa => {
                if(element.classList.contains(classa)) {
                    className = classa;
                }
            });
            if(className != undefined)
                break;
        }

        switch(className) {
            case "edit":
                aplicatie.gui.dialogs.create(editNote, {"note":{"title": item.title, "text": item.text}}, item.id);
                break;
            case "remove":
                aplicatie.notes.remove(item.id);
        }
    }

    // - for all items
    addNote(e) {
        aplicatie.gui.dialogs.create(addNote);
    }

    removeAll(e) {
        while(0 < aplicatie.notes.order.length) {
            aplicatie.notes.remove(aplicatie.notes.order[0]);
        }
    }

    getAll() {
        let result = [];
        this.order.forEach(id => result.push({note: this.list.get(id)}));
        return result;
    }

    // Item operations
    add(data) {
        let newId = this.list.get("maxId");
        this.list.set("maxId", ++newId);
        let new_item = new Note(data, newId);

        this.list.set(newId, new_item);
        this.view.create(new_item);
        this.order.push(newId);

        if (this.list.size == 2) {
            this.view.toggleEmptyMessage();
        }
    }

    edit(data, id) {
        this.list.get(id).edit(data);
        this.view.edit(this.list.get(id));
    }

    remove(id) {
        let toRemove = this.list.get(id);

        if (toRemove) {
            toRemove = null;
            this.list.delete(id);
            this.view.remove(id);
            let i = this.order.indexOf(id)
            if(i != -1) {
                this.order.splice(i, 1);
            }
        }

        if (this.list.size == 1) {
            this.view.toggleEmptyMessage();
        }
    }
}

// __________ Notes - Item object __________
class Note {
    constructor(data, id) {
        this.title = data.note.title;
        this.text = data.note.text;
        this.id = id;
    }

    edit(data) {
        this.title = data.note.title;
        this.text = data.note.text;
    }
}

// __________ Notes - View __________
class NotesView {
    constructor(controller) {
        //this.parent = document.getElementById("notes");
        document.getElementById("notes").addEventListener("click", controller.callback);
        document.getElementById("notes").addEventListener('dragstart', Draggable.dragStart, false);
        document.getElementById("notes").addEventListener('dragover', Draggable.dragOver, false);
        document.getElementById("notes").addEventListener('drop', Draggable.dragDrop, false);
        document.getElementById("notes").addEventListener('dragend', Draggable.dragEnd, false);

        document.querySelector(".card.notes .add").addEventListener("click", controller.addNote);
        document.querySelector(".card.notes .removeAll").addEventListener("click", controller.removeAll);
    }

    create(item) {
        let li = document.createElement("li");
        li.setAttribute("id", `note_${item.id}`);
        li.setAttribute("draggable", "true");

        //- Edit
        let edit = document.createElement("div");
        edit.className = "button edit";

        let icon = document.createElement("i");
        icon.className = "fas fa-pencil-alt edit";

        edit.appendChild(icon);
        li.appendChild(edit);

        //- Title
        let title = document.createElement("span");
        title.classList.add("title");
        title.innerText = item.title;
        li.appendChild(title);

        //- Text
        let text = document.createElement("pre");
        text.classList.add("text");
        text.innerText = item.text;
        li.appendChild(text);

        //- Remove Button
        let remove = document.createElement("span");
        remove.classList.add("remove");
        remove.innerText = "\u00D7";
        li.appendChild(remove);

        document.getElementById("notes").appendChild(li);

        li = edit = icon = title = text = remove = null;
    }

    edit(item) {
        document.querySelector(`.card.notes ul #note_${item.id} .title`).innerText = item.title;
        document.querySelector(`.card.notes ul #note_${item.id} .text`).innerText = item.text;
    }

    remove(id) {
        document.getElementById("notes").removeChild(document.getElementById(`note_${id}`));
    }

    toggleEmptyMessage() {
        document.querySelector(".notes .information").classList.toggle("hidden");
    }
}