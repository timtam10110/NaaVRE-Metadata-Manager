import {
  JupyterFrontEnd,
  JupyterFrontEndPlugin
} from '@jupyterlab/application';

import { ISettingRegistry } from '@jupyterlab/settingregistry';
import { Collapser } from '@jupyterlab/ui-components';
import { ILauncher } from '@jupyterlab/launcher';
import { PageConfig } from '@jupyterlab/coreutils';
import { Panel, Widget } from '@lumino/widgets';

import { tagslist } from './tags';
import { CheckboxButton, CheckboxButtonHolder } from './checkbox';


function hash(item: string): string {
  let hash = 0;
  if (item.length == 0) return hash.toString();
  for (let i = 0; i < item.length; i++) {
    let char = item.charCodeAt(i);
    hash = ((hash << 5) - hash) + char;
    hash = hash & hash; // Convert to 32bit integer
  }
  return hash.toString();
}


class metadataManagerWidget extends Widget {
  private inputFields: HTMLInputElement[] = [];

  constructor() {
    super();
    this.id = "metadataManagerWidget";
    this.title.label = 'Metadata Manager';
    this.title.closable = true;
    this.addClass('metadataManagerWidget');
  }

  async setUp(cwd: string, settingsRegistry: ISettingRegistry, id: string) {
    const settings = await settingsRegistry.load(id);

    // These are the important and required items, make a header for them to separate from the rest.
    const header = document.createElement('h2');
    header.textContent = 'Required Items:';
    this.node.appendChild(header);
    this.node.appendChild(document.createElement('br'));

    const itemsToAdd = ['Item1', 'Item2', 'Item3', 'Item4', 'Item5'];
    for (let item of itemsToAdd) {
      // Put the item name first
      const itemLabel = document.createElement('label');
      itemLabel.textContent = item + ' ';
      this.node.appendChild(itemLabel);

      // Add input field
      const inputField = document.createElement('input');
      inputField.type = 'text';
      inputField.placeholder = item;

      const savedState = settings.get(cwd + '-' + item).composite as string;
      console.log('Saved state:', savedState);
      console.log('Item:', cwd + '-' + item);
      if (savedState !== null) {
        inputField.value = savedState;
      }

      this.inputFields.push(inputField);
      this.node.appendChild(inputField);
      this.node.appendChild(document.createElement('br'));
    }
  }

  getInputValue(index: number): string {
    return this.inputFields[index].value;
  }

  getInput(index: number): HTMLInputElement {
    return this.inputFields[index];
  }

  getItemsLength(): number {
    return this.inputFields.length;
  }
}


/**
 * Initialization data for the metadata manager extension.
 */
const plugin: JupyterFrontEndPlugin<void> = {
  id: 'naavre-extension:plugin',
  description: 'A NaaVRE extension for managing metadata',
  autoStart: true,
  optional: [ISettingRegistry, ILauncher],
  activate: async (app: JupyterFrontEnd, settingRegistry: ISettingRegistry | null, launcher: ILauncher) => {

    if (!settingRegistry) {
      console.error('No setting registry available for Metadata Manager extension, exiting.');
      return;
    }

    if (!launcher) {
      console.error('No launcher available for Metadata Manager extension, exiting.');
      return;
    }

    try {
      const settings = await settingRegistry.load(plugin.id);
      console.log('naavre-extension settings loaded:', settings.composite);

      const CWD = PageConfig.getOption('serverRoot');
      const CWDHash = hash(CWD);    // -1873337822
      console.log('Current working directory:', CWD);
      console.log('hash:', CWDHash);

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
          let savedState = settings.get(CWDHash + tagname).composite as boolean;
          if (savedState !== undefined) { // Load the saved state of the checkbox.
            newcheckbox.checkbox.checked = savedState;
          }

          newcheckbox.node.onclick = () => {  // Save the state of the checkbox.
            newcheckbox.checkbox.checked = !newcheckbox.checkbox.checked;
            settings.set(CWDHash + tagname, newcheckbox.checkbox.checked);
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

      // Add a launcher item
      const metadata_item: ILauncher.IItemOptions = {
        command: 'metadatamanager:open',
        category: 'Other',
        rank: 1000
      };
      launcher.add(metadata_item);

      const { commands } = app;
      commands.addCommand('metadatamanager:open', {
        label: 'Open metadata manager Widget',
        execute: () => {
          const widget = new metadataManagerWidget();
          widget.setUp(CWDHash, settingRegistry, plugin.id);
          app.shell.add(widget, 'main');
          app.shell.activateById(widget.id);
          app.shell.currentWidget?.close();

          // Make all input fields in the widget listen for changes.
          for (let i = 0; i < widget.getItemsLength(); i++) {
            widget.getInput(i).addEventListener('change', () => {
              console.log('Input field changed:', widget.getInputValue(i));

              settings.set(CWDHash + '-' + widget.getInput(i).placeholder, widget.getInputValue(i));
              console.log(CWDHash + '-' + widget.getInput(i).placeholder, widget.getInputValue(i));
            });
          }
        }
      });

    } catch(reason) {
      console.error('Failed to load settings for naavre-extension.', reason);
    };
  }
};

export default plugin;
