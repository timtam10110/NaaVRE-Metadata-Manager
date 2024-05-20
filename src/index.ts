import {
  JupyterFrontEnd,
  JupyterFrontEndPlugin
} from '@jupyterlab/application';

import { ISettingRegistry } from '@jupyterlab/settingregistry';
import { Collapse } from '@jupyterlab/apputils';
import { Panel, Widget } from '@lumino/widgets';
import { tagslist } from './tags';


class CheckboxButtonHolder extends Widget {
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


class CheckboxButton extends Widget {
  private checkbox: HTMLInputElement;
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

    this.node.onclick = () => {
      this.checkbox.checked = !this.checkbox.checked;
      console.log('Checkbox button clicked, checked:', this.labelstring, this.checkbox.checked);
    };
  }

  show(): void {
    this.node.style.display = 'block';
  }

  hide(): void {
    this.node.style.display = 'none';
  }
}


/**
 * Initialization data for the naavre-extension extension.
 */
const plugin: JupyterFrontEndPlugin<void> = {
  id: 'naavre-extension:plugin',
  description: 'A NaaVRE extension for managing metadata',
  autoStart: true,
  optional: [ISettingRegistry],
  activate: (app: JupyterFrontEnd, settingRegistry: ISettingRegistry | null) => {
    console.log('JupyterLab extension naavre-extension is activated! 2');

    if (settingRegistry) {
      settingRegistry
        .load(plugin.id)
        .then(settings => {
          console.log('naavre-extension settings loaded:', settings.composite);
        })
        .catch(reason => {
          console.error('Failed to load settings for naavre-extension.', reason);
        });
    }

    // Create a new panel and add the collapse and toolbar button.
    const myPanel = new Panel();
    myPanel.id = "naavre-panel";

    for (let tag of tagslist) {
      const newcollapse = new Collapse({
        widget: new CheckboxButtonHolder(),
        collapsed: true
      });
      newcollapse.id = tag.get_category() + '-collapse';
      newcollapse.title.label = tag.get_category();
      myPanel.addWidget(newcollapse);

      for (let tagname of tag.get_tags()) {
        const newcheckbox = new CheckboxButton(tagname);
        newcheckbox.id = tagname + '-checkbox-button';
        newcheckbox.hide();
        myPanel.addWidget(newcheckbox);
        newcollapse.widget.addCheckbox(newcheckbox);
      }

      newcollapse.collapseChanged.connect((sender, collapsed) => {
        for (let box of newcollapse.widget.getCheckboxes()) {
          if (newcollapse.collapsed) {
            box.hide();
          } else {
            box.show();
          }
        }
      }
    )};

    // Add the panel to the toolbar on the left.
    app.shell.add(myPanel, 'left', { rank: 1000 });

  }
};

export default plugin;
