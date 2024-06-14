import {
  JupyterFrontEnd,
  JupyterFrontEndPlugin
} from '@jupyterlab/application';

import { ISettingRegistry } from '@jupyterlab/settingregistry';
import { Collapser } from '@jupyterlab/ui-components';
import { ILauncher } from '@jupyterlab/launcher';
import { PageConfig } from '@jupyterlab/coreutils';
import { Panel, Widget } from '@lumino/widgets';

import { tagslist, required_metadata, optional_metadata } from './tags';
import { CheckboxButton, CheckboxButtonHolder } from './checkbox';
import '../style/index.css';


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
    this.addClass('metadata-manager-widget-container');
  }

  // Set up the widget with the required items. Made async so it can access settings.
  setUp(cwd: string, settings: ISettingRegistry.ISettings, app: JupyterFrontEnd) {
    // Set height for the widget to the height of the window. Very bootleg fix but setting values in css doesn't work.
    this.node.style.height = window.innerHeight + 'px';

    // These are the important and required items, make a header for them to separate from the rest.
    const header = document.createElement('h2');
    header.textContent = 'Required Items:';
    this.node.appendChild(header);
    this.node.appendChild(document.createElement('br'));

    const itemsToAdd = required_metadata;
    for (let item of itemsToAdd) {
      this.addItem(item, settings, cwd);
    }

    // These are the optional items, make a header for them to separate from the rest.
    const optionalHeader = document.createElement('h2');
    optionalHeader.textContent = 'Optional Items:';
    this.node.appendChild(optionalHeader);
    this.node.appendChild(document.createElement('br'));

    const optionalItemsToAdd = optional_metadata;
    for (let item of optionalItemsToAdd) {
      this.addItem(item, settings, cwd);
    }
    this.node.appendChild(document.createElement('br'));

    const button = document.createElement('button');
    button.textContent = 'Export Metadata';
    this.node.appendChild(button);

    button.addEventListener('click', () => {
      // download the metadata as a json file
      const metadata = this.toJSON(settings);
      const metadataString = JSON.stringify(metadata, null, 2);
      const blob = new Blob([metadataString], {type: "application/json"});
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = "metadata.json";
      document.body.appendChild(a);
      a.click();
      window.URL.revokeObjectURL(url);
      document.body.removeChild(a);
    });

    // API Key field
    const API_Key_label = document.createElement('label');
    API_Key_label.textContent = 'API Key: ';
    this.node.appendChild(API_Key_label);

    const API_Key_input_field = document.createElement('input');
    API_Key_input_field.type = 'text';
    API_Key_input_field.placeholder = 'API Key';
    this.node.appendChild(API_Key_input_field);
    this.node.appendChild(document.createElement('br'));

    // Publish button, no behaviour for now.
    const publish_button = document.createElement('button');
    publish_button.textContent = 'Publish';
    this.node.appendChild(publish_button);
    this.node.appendChild(document.createElement('br'));

    // Create button that logs all files in the current directory.
    const log_button = document.createElement('button');
    log_button.textContent = 'Log Files';
    this.node.appendChild(log_button);

    log_button.addEventListener('click', async () => {
      const filebrowser = app.serviceManager.contents;
      const files = await filebrowser.get("./");

      // Log content of all files in the current directory.
      for (let file of files.content) {
        console.log(file.name);
        const filecontent = await filebrowser.get(file.path, { content: true });
        console.log(filecontent.content);
      }
    });
  }

  addItem(item: string, settings: ISettingRegistry.ISettings, cwd: string): void {
    // Put the item name first
    const itemLabel = document.createElement('label');
    itemLabel.textContent = item + ' ';
    itemLabel.className = 'metadata-manager-widget-label';
    this.node.appendChild(itemLabel);

    // Add input field
    const inputField = document.createElement('input');
    inputField.type = 'text';
    inputField.placeholder = item;
    inputField.name = item;
    inputField.className = 'metadata-manager-widget-input';

    // Load saved value
    const savedState = settings.get(cwd + '-' + item).composite as string;
    if (savedState !== null && savedState !== undefined) {
      inputField.value = savedState;
    }

    this.inputFields.push(inputField);
    this.node.appendChild(inputField);

    // Add a listener to the input field
    inputField.addEventListener('change', () => {
      settings.set(cwd + '-' + inputField.name, inputField.value);
    });
  }

  getInput(index: number): HTMLInputElement {
    return this.inputFields[index];
  }

  getItemsLength(): number {
    return this.inputFields.length;
  }

  toJSON(settings: ISettingRegistry.ISettings): any {
    let obj: any = {};
    // Set up RO-Crate metadata
    obj["@context"] = "https://w3id.org/ro/crate/1.1/context";

    // File descriptor
    const filedescriptor = {
      "@type": "CreativeWork",
      "@id": "ro-crate-metadata.json",
      "conformsTo": {"@id": "https://w3id.org/ro/crate/1.1"},
      "about": {"@id": "./"}
    };
    obj["@graph"] = [filedescriptor];

    for (let i = 0; i < this.inputFields.length; i++) {
      if (this.inputFields[i].name.includes("license")) {
        if (!obj["license"]) {
          obj["license"] = {};
        }
        obj["license"][this.inputFields[i].name] = this.inputFields[i].value;
        continue;
      }
      // If field is empty, ignore
      if (this.inputFields[i].value === '') {
        continue;
      }
      obj[this.inputFields[i].name] = this.inputFields[i].value;
    }

    // Loop over the checkboxes and add them to an array
    var keywords = [];
    const cwd = hash(PageConfig.getOption('serverRoot'));
    for (let tag of tagslist) {
      for (let tagname of tag.get_tags()) {
        const tagvar = cwd + tagname;
        let savedState = settings.get(tagvar).composite as boolean;
        if (savedState !== undefined && savedState !== null && savedState !== false) {
          keywords.push(tagname);
        }
      }
    }
    if (keywords.length > 0) obj["keywords"] = keywords;
    return obj;
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
      const CWDHash = hash(CWD);

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
        label: 'Metadata Manager',
        execute: () => {
          const widget = new metadataManagerWidget();
          widget.setUp(CWDHash, settings, app);

          // Focus on the new window.
          app.shell.add(widget, 'main');
          app.shell.currentWidget?.close();
          app.shell.activateById(widget.id);
        }
      });

    } catch(reason) {
      console.error('Failed to load settings for naavre-extension.', reason);
    };
  }
};

export default plugin;
