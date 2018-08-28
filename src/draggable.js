var draggedId;
// __________ Draggable __________
class Draggable {
    static dragStart(e) {
        // init drag
        e.dataTransfer.effectAllowed = "move";
        e.dataTransfer.setData("text", e.target.id);
        draggedId = e.target.id;

        // change drag image
        let img = document.createElement("img");
        img.src = "res/img/drag.png";
        e.dataTransfer.setDragImage(img, 0, 0);

        // set style for drag area
        e.target.parentNode.classList.add("dragging");
    }

    static dragEnter(e) {

    }

    static dragLeave(e) {

    }

    static dragOver(e) {
        let over;
        for(over = e.target; over.tagName.toLowerCase() != "li" && over.tagName.toLowerCase() != "html"; over = over.parentNode);
        if(over.tagName.toLowerCase() != "li") {
            return false;
        }
        //let dragged = document.getElementById(e.dataTransfer.getData("text"));
        let dragged = document.getElementById(draggedId);

        if(dragged.id.slice(0, dragged.id.indexOf("_")) != over.id.slice(0, over.id.indexOf("_"))) {
            return;
        } else {
            e.preventDefault() //allow drop
        }

        if(dragged.id == over.id) {
            over.classList.add("over");
        } else {
            if(Draggable.isBefore(dragged, over)) {
                over.parentNode.insertBefore(dragged, over);
            } else {
                over.parentNode.insertBefore(dragged, over.nextSibling);
            }

            over.classList.remove("move");
            setTimeout(() => {over.classList.add("move");over=null;}, 10);
        }
    }

    static dragDrop(e) {
        //prevent redirect
        e.preventDefault();
        e.stopPropagation();
    }

    static dragEnd(e) {
        //let dragged = document.getElementById(e.dataTransfer.getData("text/plain"));
        let dragged = document.getElementById(draggedId);
        dragged.classList.remove("over");
        dragged.parentNode.classList.remove("dragging");

        let order = [];
        dragged.parentNode.childNodes.forEach((item) => {
            order.push(parseInt(item.id.slice(item.id.indexOf("_") + 1)));
            item.classList.remove("move");
        })

        let type = dragged.parentNode.id;
        switch(type) {
            case "tasks":
                aplicatie.tasks.order.set(order);
                break;
            case "backlog":
                aplicatie.backlog.order = order;
                break;
            case "notes":
                aplicatie.notes.order = order;
                break;
        }
    }

    //helper functions
    static isBefore(el1, el2) {
        if (el2.parentNode === el1.parentNode)
            for (let current = el1.previousSibling; current; current = current.previousSibling)
                if (current === el2)
                    return true;
        return false;
    }
}