import {
  JupyterFrontEnd,
  JupyterFrontEndPlugin
} from '@jupyterlab/application';

import { ISettingRegistry } from '@jupyterlab/settingregistry';
import { Collapser } from '@jupyterlab/ui-components';
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

/**
 * Initialization data for the naavre-extension extension.
 */
const plugin: JupyterFrontEndPlugin<void> = {
  id: 'naavre-extension:plugin',
  description: 'A NaaVRE extension for managing metadata',
  autoStart: true,
  optional: [ISettingRegistry],
  activate: async (app: JupyterFrontEnd, settingRegistry: ISettingRegistry | null) => {
    console.log('JupyterLab extension naavre-extension is activated!');

    if (settingRegistry) {
      try {
        const settings = await settingRegistry.load(plugin.id);
        console.log('naavre-extension settings loaded:', settings.composite);

        // This is the panel in which the extension lives.
        const myPanel = new Panel();
        myPanel.id = "naavre-panel";

        // Load categories for tags..
        for (let tag of tagslist) {
          const div = document.createElement('div');
          div.textContent = tag.get_category();
          const newcollapse = new Collapser({
            widget: new CheckboxButtonHolder(), // Needed to track all checkboxes for a category.
            node: div,
            collapsed: true
          });
          newcollapse.id = tag.get_category() + '-collapse';
          myPanel.addWidget(newcollapse);

          // Load tags within the category.
          for (let tagname of tag.get_tags()) {
            const newcheckbox = new CheckboxButton(tagname);
            newcheckbox.id = tagname + '-checkbox-button';
            newcheckbox.hide();
            let savedState = settings.get(tagname).composite as boolean;
            if (savedState !== undefined) { // Load the saved state of the checkbox.
              newcheckbox.checkbox.checked = savedState;
            }

            newcheckbox.node.onclick = () => {  // Save the state of the checkbox.
              newcheckbox.checkbox.checked = !newcheckbox.checkbox.checked;
              settings.set(tagname, newcheckbox.checkbox.checked);
              console.log('Checkbox button clicked, checked:', tagname, newcheckbox.checkbox.checked);
            }
            myPanel.addWidget(newcheckbox);
            newcollapse.widget.addCheckbox(newcheckbox);
          }

          // Add a listener to the collapse button to hide/show the checkboxes.
          newcollapse.collapseChanged.connect((sender, collapsed) => {
            for (let box of newcollapse.widget.getCheckboxes()) {
              if (newcollapse.collapsed) {
                box.hide();
              } else {
                box.show();
              }
            }
          })
        };

        // Add the panel to the toolbar on the left.
        app.shell.add(myPanel, 'left', { rank: 1000 });
      } catch(reason) {
        console.error('Failed to load settings for naavre-extension.', reason);
      };
    }
  }
};

export default plugin;
