import {
  Component, Input, Output, EventEmitter,
  AfterViewInit, OnDestroy, ViewChild, ElementRef
} from '@angular/core';

declare const monaco: any;

@Component({
  selector: 'app-monaco-editor',
  standalone: true,
  template: `<div #editorHost class="editor-host"></div>`,
  styles: [`
    :host { display: block; height: 100%; width: 100%; }
    .editor-host { height: 100%; width: 100%; }
  `]
})
export class MonacoEditorComponent implements AfterViewInit, OnDestroy {
  @ViewChild('editorHost', { static: true }) editorHost!: ElementRef<HTMLDivElement>;

  @Input() language: string = 'java';
  @Input() theme: string = 'vs-dark';
  @Input() value: string = '';
  @Output() valueChange = new EventEmitter<string>();

  private editor: any = null;
  private pollInterval: any = null;

  ngAfterViewInit() {
    this.waitForMonacoAndInit();
  }

  private waitForMonacoAndInit() {
    // Monaco may still be loading asynchronously from CDN
    if (typeof monaco !== 'undefined') {
      this.createEditor();
    } else {
      this.pollInterval = setInterval(() => {
        if (typeof monaco !== 'undefined') {
          clearInterval(this.pollInterval);
          this.createEditor();
        }
      }, 100);
    }
  }

  private createEditor() {
    if (this.editor) return; // already created

    this.editor = monaco.editor.create(this.editorHost.nativeElement, {
      value: this.value,
      language: this.language,
      theme: this.theme,
      automaticLayout: true,
      fontSize: 14,
      minimap: { enabled: false },
      lineNumbers: 'on',
      scrollBeyondLastLine: false,
      readOnly: false
    });

    this.editor.onDidChangeModelContent(() => {
      this.valueChange.emit(this.editor.getValue());
    });
  }

  ngOnDestroy() {
    clearInterval(this.pollInterval);
    if (this.editor) {
      this.editor.dispose();
      this.editor = null;
    }
  }
}
