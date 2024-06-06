import { Widget } from '@lumino/widgets';


export class CheckboxButtonHolder extends Widget {
    private checkboxlist: CheckboxButton[];

    constructor() {
      super();
      this.checkboxlist = [];
    }

    addCheckbox(checkbox: CheckboxButton): void {
      this.checkboxlist.push(checkbox);
    }

    getCheckboxes(): CheckboxButton[] {
      return this.checkboxlist;
    }
}

export class CheckboxButton extends Widget {
    public checkbox: HTMLInputElement;
    public labelstring: string;

    constructor(labelstring: string) {
      super();
      this.labelstring = labelstring;
      this.addClass('myCheckboxButton');
      this.checkbox = document.createElement('input');
      this.checkbox.type = 'checkbox';
      this.checkbox.onclick = (event) => {
        this.checkbox.checked = !this.checkbox.checked; // Needed so it also switches when you click the checkbox itself. :skull:
      }
      this.node.appendChild(this.checkbox);

      const label = document.createElement('label');
      label.textContent = this.labelstring;
      this.node.appendChild(label);
    }

    show(): void {
      this.node.style.display = 'block';
    }

    hide(): void {
      this.node.style.display = 'none';
    }

    get checked(): boolean {
      return this.checkbox.checked;
    }

    set checked(checked: boolean) {
      this.checkbox.checked = checked;
    }
}