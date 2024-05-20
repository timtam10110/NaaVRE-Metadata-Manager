import {
  JupyterFrontEnd,
  JupyterFrontEndPlugin
} from '@jupyterlab/application';

import { ISettingRegistry } from '@jupyterlab/settingregistry';
import { Collapse } from '@jupyterlab/apputils';
import { Panel, Widget } from '@lumino/widgets';


class CheckboxButton extends Widget {
  private checkbox: HTMLInputElement;

  constructor() {
    super();
    this.addClass('myCheckboxButton');
    this.checkbox = document.createElement('input');
    this.checkbox.type = 'checkbox';
    this.checkbox.onclick = (event) => {
      this.checkbox.checked = !this.checkbox.checked; // Needed so it also switches when you click the checkbox itself. :skull:
    }
    this.node.appendChild(this.checkbox);

    const label = document.createElement('label');
    label.textContent = 'Click me';
    this.node.appendChild(label);

    this.node.onclick = () => {
      this.checkbox.checked = !this.checkbox.checked;
      console.log('Checkbox button clicked, checked:', this.checkbox.checked);
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

    const myCheckboxButton = new CheckboxButton();
    myCheckboxButton.id = 'naavre-checkbox-button';
    myCheckboxButton.hide();


    // Create a new collapsable button.
    const myCollapse = new Collapse({
      widget: new Widget(),
      collapsed: true
    });
    myCollapse.id = 'naavre-button';
    myCollapse.title.label = 'Yippee';

    // When collapse changes, make toolbarbutton visible.
    myCollapse.collapseChanged.connect((sender, collapsed) => {
      if (myCollapse.collapsed) {
        myCheckboxButton.hide();
      } else {
        myCheckboxButton.show();
      }
    });

    // Create a new panel and add the collapse and toolbar button.
    const myPanel = new Panel();
    myPanel.id = "naavre-panel";
    myPanel.addWidget(myCollapse);
    myPanel.addWidget(myCheckboxButton);

    // Add the panel to the toolbar on the left.
    app.shell.add(myPanel, 'left', { rank: 1000 });

  }
};

export default plugin;
