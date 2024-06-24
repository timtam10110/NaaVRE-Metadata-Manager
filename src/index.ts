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

var metadata_items = {
  "Required items": required_metadata,
  "Custom items": optional_metadata
}

function escapeSpecialCharacters(str: string): string {
  const encoded = encodeURIComponent(str);
  const decoded = encoded
  .replace(/%2E/g, '.')  // Do not encode the dot character (.)
  .replace(/%2F/g, '/');  // Do not encode the slash character (/)

  return decoded;
}


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


function downloadJSON(json: any, name: string): void {
  const jsonString = JSON.stringify(json, null, 2);
  const blob = new Blob([jsonString], {type: "application/json"});
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = name;
  document.body.appendChild(a);
  a.click();
  window.URL.revokeObjectURL(url);
  document.body.removeChild(a);
}


function openFileDialog(): Promise<File | null> {
  return new Promise((resolve, reject) => {
    const input = document.createElement('input');
    input.type = 'file';
    input.accept = '.json';
    input.onchange = () => {
      if (input.files !== null && input.files.length > 0) {
        resolve(input.files[0]);
      } else {
        resolve(null);
      }
    };
    input.click();
  });
}


class metadataManagerWidget extends Widget {
  private inputFields: HTMLInputElement[] = [];
  private app: JupyterFrontEnd;
  private cwdhash: string;
  private settings: ISettingRegistry.ISettings;

  constructor(app: JupyterFrontEnd, cwd: string, settings: ISettingRegistry.ISettings) {
    super();
    this.id = "metadataManagerWidget";
    this.title.label = 'Metadata Manager';
    this.title.closable = true;
    this.addClass('metadata-manager-widget-container');
    this.app = app;
    this.cwdhash = cwd;
    this.settings = settings;
  }

  // Set up the widget with the required items.
  setUp() {
    // Set height for the widget to the height of the window. Very bad fix but setting values in css doesn't work.
    this.node.style.height = window.innerHeight + 'px';

    // Loop over the items and add them to the widget.
    Object.entries(metadata_items).forEach(([header, items]) => {
      this.addHeaderAndItems(header, items);
    });

    this.node.appendChild(document.createElement('br'));
    const ROCrateExportButton = document.createElement('button');
    ROCrateExportButton.textContent = 'Export Metadata to RO Crate';
    this.node.appendChild(ROCrateExportButton);

    ROCrateExportButton.addEventListener('click', async () => {
      downloadJSON(await this.toROCrateJSON(), "ro-crate-metadata.json");
    });

    this.node.appendChild(document.createElement('br'));
    const ROCrateImportButton = document.createElement('button');
    ROCrateImportButton.textContent = 'Import Metadata from RO Crate';
    this.node.appendChild(ROCrateImportButton);

    ROCrateImportButton.addEventListener('click', async () => {
      const file = await openFileDialog();
      if (file !== null) {
        const reader = new FileReader();
        reader.onload = async () => {
          const obj = JSON.parse(reader.result as string);
          this.fromROCrateJSON(obj);
        };
        reader.readAsText(file);
      } else {
        console.error('No file selected.');
      }
    });

    this.node.appendChild(document.createElement('br'));

    // Add button to export all current fields, not the values. Essentially, export the schematic.
    const exportButton = document.createElement('button');
    exportButton.textContent = 'Export Schematic';
    this.node.appendChild(exportButton);

    exportButton.addEventListener('click', async () => {
      downloadJSON(this.exportSchematic(), "metadata-schematic.json");
    });

    this.node.appendChild(document.createElement('br'));

    // Add button to import a schematic. This will overwrite all current fields.
    const importButton = document.createElement('button');
    importButton.textContent = 'Import Schematic';
    this.node.appendChild(importButton);

    importButton.addEventListener('click', async () => {
      const file = await openFileDialog();
      if (file !== null) {
        const reader = new FileReader();
        reader.onload = async () => {
          const schematic = JSON.parse(reader.result as string);
          this.importSchematic(schematic);
        };
        reader.readAsText(file);
      } else {
        console.error('No file selected.');
      }
    });

    const url_label = document.createElement('label');
    url_label.textContent = 'API Insert URL';
    url_label.className = 'metadata-manager-widget-label';
    this.node.appendChild(url_label);

    const url_input = document.createElement('input');
    url_input.type = 'text';
    url_input.placeholder = 'default URL is http://localhost:5000/api/insert';
    url_input.name = 'API Insert URL';
    url_input.className = 'metadata-manager-widget-input';
    this.node.appendChild(url_input);

    this.node.appendChild(document.createElement('br'));
    const log_button = document.createElement('button');
    log_button.textContent = 'Push Metadata To MongoDB';
    this.node.appendChild(log_button);

    log_button.addEventListener('click', async () => {
      // Get url from input field
      let url = url_input.value;
      if (url === '') {
        console.warn('No API URL provided. Using default URL (http://localhost:5000/api/insert)');
        url = 'http://localhost:5000/api/insert';
      }

      const metadata = await this.toROCrateJSON();
      try {
        const response = await fetch(url, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json'
          },
          body: JSON.stringify(metadata)
        });

        if (!response.ok) {
          console.error('Failed to log metadata to the server.');
        }

        const data = await response.json();
        console.log(data["id"]);
      } catch (error) {
        console.error('Failed to log metadata to the server.', error);
      }
    });
  }

  reset(): void {
    // Close the current window and open a new one, with everything set up anew. Not the cleanest method, but certainly the easiest.
    const widget = new metadataManagerWidget(this.app, this.cwdhash, this.settings);
    widget.setUp();

    // Focus on the new window.
    this.app.shell.add(widget, 'main');
    this.app.shell.currentWidget?.close();
    this.app.shell.activateById(widget.id);
  }

  exportSchematic(): any {
    let schematic: any = {};
    let currentHeader: string = '';
    let currentList: string[] = [];
    for (let node of this.node.childNodes) {
      if (node.nodeName === 'H2') {
        if (currentHeader !== '') {
          schematic[currentHeader] = currentList;             // Push current header and items into the schematic.
        }
        currentHeader = node.textContent?.trim() as string;   // Set the new header.
        currentList = [];
      } else if (node.nodeName === 'LABEL') {
        currentList.push(node.textContent?.trim() as string); // Add the item to the list.
      }
    }
    schematic[currentHeader] = currentList;                   // Push the last header and items into the schematic.
    return schematic;
  }

  importSchematic(schematic: any): void {
    let required_items = metadata_items["Required items"];     // Ensures that the required items are always present.
    let new_metadata_items: any = {};
    new_metadata_items["Required items"] = required_items;
    for (let header of Object.keys(schematic)) {
      if (header === "Required items") {
        continue;
      }
      new_metadata_items[header] = schematic[header];
    }
    metadata_items = new_metadata_items;
    this.reset();
  }

  addHeaderAndItems(header: string, items: string[]): void {
    const headerElement = document.createElement('h2');
    headerElement.textContent = header;
    this.node.appendChild(headerElement);
    this.node.appendChild(document.createElement('br'));

    for (let item of items) {
      this.addItem(item);
    }
  }

  addItem(item: string): void {
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
    const savedState = this.settings.get(this.cwdhash + '-' + item).composite as string;
    if (savedState !== null && savedState !== undefined) {
      inputField.value = savedState;
    }

    this.inputFields.push(inputField);
    this.node.appendChild(inputField);

    // Add a listener to the input field
    inputField.addEventListener('change', () => {
      this.settings.set(this.cwdhash + '-' + inputField.name, inputField.value);
    });
  }

  getFromInputName(name: string): string {
    for (let input of this.inputFields) {
      if (input.name === name) {
        return input.value;
      }
    }
    return '';
  }

  async getAllFiles(currentpath: string, allFiles: any[]): Promise<any[]> {
    let filesList: any[] = [];
    const filebrowser = this.app.serviceManager.contents;
    const files = await filebrowser.get("./" + currentpath);
    for (let file of files.content) {
      filesList.push(file);
    }
    allFiles = allFiles.concat(filesList);
    for (let file of filesList) {
      if (file.type === "directory") {
        allFiles = await this.getAllFiles(currentpath + file.name + "/", allFiles);
      }
    }
    return allFiles;
  }

  async fromROCrateJSON(obj: any): Promise<void> {
    // Set up RO-Crate metadata
    const graph = obj["@graph"];
    const filedescriptor = graph[0];

    let filedone = false;
    for (let file of graph) {
      if (file["@type"] === "File" && !filedone) {
        // Store the metadata in the settings if it is in the list of input fields.
        for (let key of Object.keys(file)) {
          if (key !== "@id" && key !== "@type" && key !== "name" && key !== "contentSize" && key !== "dateCreated" && key !== "dateModified" && key !== "encodingFormat" && key !== "author") {
            if (key === "license") {
              this.settings.set(this.cwdhash + '-' + "license_url", file[key]["@id"]);
            } else {
              this.settings.set(this.cwdhash + '-' + key, file[key]);
            }
          }
        }
        filedone = true;  // Don't check files again, as they all store the same information.
      }
      if (file["@type"] === "Person") { // Set author.
        this.settings.set(this.cwdhash + '-' + "creator", file["name"]);
      }
    }

    // Set keywords and update the checkboxes. (Worst case scenario, ask user to refresh jupyterlab, but should be doable without.)
    const keywords = filedescriptor.keywords;
    for (let tag of tagslist) {
      for (let tagname of tag.get_tags()) {
        let tagvar = this.cwdhash + tagname;
        this.settings.set(tagvar, keywords.includes(tagname));  // if tagname in keywords, set to true, otherwise false
      }
    }
    this.reset(); // Supposed to reset the widget, doesn't work as intended. Cause unsure, as it works when importing a schema.
  }

  async toROCrateJSON(): Promise<any> {
    let obj: any = {};

    // Load context json file from internet
    const context_url = "https://w3id.org/ro/crate/1.1/context";
    const context_response = await fetch(context_url);
    const context_json = await context_response.json();
    const items = context_json["@context"];

    // Loop over all input field labels, and if the label is not in the context, add it as a new item.
    let new_items: any = {};
    for (let item of this.inputFields) {
      if (items[item.name] === undefined && item.name !== "license_url" && item.name !== "creator" && item.value !== "") {
        new_items[item.name] = item.name;
      }
    }
    obj["@context"] = [context_url, new_items]

    // Loop over the checkboxes and add them to an array
    let keywords = [];
    for (let tag of tagslist) {
      for (let tagname of tag.get_tags()) {
        const tagvar = this.cwdhash + tagname;
        let savedState = this.settings.get(tagvar).composite as boolean;
        if (savedState !== undefined && savedState !== null && savedState !== false) {
          keywords.push(tagname);
        }
      }
    }

    // File descriptor
    const filedescriptor = {
      "@type": "CreativeWork",
      "@id": "ro-crate-metadata.json",
      "conformsTo": {"@id": "https://w3id.org/ro/crate/1.1"},
      "about": {"@id": "./"},
      "keywords": keywords  // Keywords apply to all files, so put them here once instead of repeating over and over.
      // Technically a lot of other things are shared between files as well. This is just an arbitrary decision, can be changed later.
    };

    const allfiles = await this.getAllFiles("", []);
    const allfilepaths = allfiles.map((file: any) => file.path);

    // Now, we need to create the RO-Crate structure.
    // First, the root directory
    const root = {
      "@id": "./",
      "@type": "Dataset",
      "hasPart": allfilepaths.map((path: string) => {
        return {"@id": escapeSpecialCharacters(path)};
      })
    };

    // Then, all the folders
    var folders = [];
    for (let file of allfiles) {
      if (file.type === "directory") {
        const filesInFolder = await this.getAllFiles(file.path + "/", []);
        const filenamesInFolder = filesInFolder.map((file: any) => file.path);
        var folder;

        if (filesInFolder.length === 0) { // If the folder is empty, do not include hasPart.
          folder = {
            "@id": file.path + "/",
            "@type": "Dataset"
          };
        } else {
          folder = {
            "@id": file.path + "/",
            "@type": "Dataset",
            "hasPart": filenamesInFolder.map((path: string) => {
              return {"@id": escapeSpecialCharacters(path)};
            })
          };
        };
        folders.push(folder);
      }
    }

    // Collect general information for files.
    const license = this.getFromInputName("license_url");
    const creator = this.getFromInputName("creator");
    const creator_firstname = creator.slice(0, creator.indexOf(" "));

    const creator_val = {
      "@id": "#" + (creator_firstname.length > 0 ? creator_firstname : "Unknown"),
      "@type": "Person",
      "name": creator.length > 0 ? creator : "Unknown"
    };

    var title = this.getFromInputName("title");
    if (title === '') { title = "No title set"; }

    // Finally, all the files
    var files = [];
    for (let file of allfiles) {
      if (file.type === "file" || file.type === "notebook") {
        let filetype = file.type;
        // If filetype is a programming language, update filetype to also include "SoftwareSourceCode"
        if (filetype === "file") {
          const extension = file.name.split('.').pop();
          if (extension === "py" || extension === "R" || extension === "jl" || extension === "js" || extension === "java" || extension === "c" || extension === "cpp" || extension === "h" || extension === "hpp") {
            filetype = ["File", "SoftwareSourceCode"];
          } else {
            filetype = "File";
          }
        } else { // Notebook
          filetype = ["Notebook", "SoftwareSourceCode"];
        }

        const filecontent = await this.app.serviceManager.contents.get(file.path, { content: true });
        const fileinfo: any = {
          "@id": escapeSpecialCharacters(file.path),
          "@type": filetype,
          "name": file.name,
          "contentSize": filecontent.content.length,
          "dateCreated": file.created,
          "dateModified": file.last_modified,
          "encodingFormat": file.type === "notebook" ? "application/jupyter+json" : file.mimetype,
          "license": {"@id": license.length > 0 ? license : "https://creativecommons.org/publicdomain/zero/1.0/"},
          "title": title,
          "author": {"@id": "#" + creator_firstname}
        };

        // Loop over new_items and add them to the fileinfo
        for (let item of this.inputFields) {
          if (items[item.name] === undefined && item.name !== "license_url" && item.name !== "creator" && item.value.length > 0) {
            fileinfo[item.name] = item.value;
          }
        }
        files.push(fileinfo);
      }
    }

    obj["@graph"] = [filedescriptor, root];
    obj["@graph"] = obj["@graph"].concat(folders);
    obj["@graph"] = obj["@graph"].concat(files);
    obj["@graph"] = obj["@graph"].concat([creator_val]);
    return obj;
  }
}


/**
 * Initialization data for the jupyter-lab-metadata-manager extension.
 */
const plugin: JupyterFrontEndPlugin<void> = {
  id: 'jupyter-lab-metadata-manager:plugin',
  description: 'A Jupyter Lab extension for managing metadata',
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
          const widget = new metadataManagerWidget(app, CWDHash, settings);
          widget.setUp();

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
