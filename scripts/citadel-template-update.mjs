// Scoped, reproducible preflight for the explicitly requested Citadel boxes.
// The protected file is updated only after these rendered changes are reviewed.
export function restoreCitadelBoxes(source) {
  const oldNotes = `      const citadelNote=document.getElementById('citadelNote');
      const citadelNoteFrame=document.getElementById('citadelNoteFrame');
      if(window.parent===window){
        citadelNoteFrame.src='/?masterInline=citadel-note';
        addEventListener('message',event=>{
          if(event.origin!==location.origin||event.source!==citadelNoteFrame.contentWindow||
             event.data?.type!=='ci-citadel-note-height')return;
          const height=Math.max(0,Math.ceil(Number(event.data.height)||0));
          citadelNoteFrame.style.height=Math.max(1,height)+'px';
          citadelNote.hidden=!height;
          reportHeight();
        });
      }`;
  const newNotes = `      const citadelNotes=[
        {box:document.getElementById('citadelNote'),frame:document.getElementById('citadelNoteFrame'),url:'/?masterInline=citadel-note',height:0},
        {box:document.getElementById('citadelBottomNote'),frame:document.getElementById('citadelBottomNoteFrame'),url:'/?masterInline=citadel-note&box=2',height:0}
      ];
      let citadelHomeVisible=false;
      if(window.parent===window){
        addEventListener('message',event=>{
          if(event.origin!==location.origin||event.data?.type!=='ci-citadel-note-height')return;
          const note=citadelNotes.find(item=>event.source===item.frame.contentWindow);
          if(!note)return;
          note.height=Math.max(0,Math.ceil(Number(event.data.height)||0));
          note.frame.style.height=Math.max(1,note.height)+'px';
          note.box.hidden=!citadelHomeVisible||!note.height;
          reportHeight();
        });
      }`;
  const replacements = [
    [oldNotes,newNotes],
    ['      function show(view){',`      function show(view){
        const wasCitadel=citadelHomeVisible;
        citadelHomeVisible=view===home&&window.parent===window;
        citadelNotes.forEach(note=>{
          note.box.hidden=!citadelHomeVisible||!note.height;
          // Re-read saved text/session after returning from Admin or another tool.
          if(citadelHomeVisible&&!wasCitadel)note.frame.src=note.url;
        });`],
    ['    <nav class="deck" data-template-region="lower-icon-trough"', '    <div class="citadel-note" id="citadelBottomNote" hidden><iframe id="citadelBottomNoteFrame" title="Citadel closing message" scrolling="no"></iframe></div>\n    <nav class="deck" data-template-region="lower-icon-trough"'],
  ];
  for (const [before,after] of replacements) {
    if(source.split(before).length!==2)throw new Error('Citadel preflight target changed');
    source=source.replace(before,after);
  }
  return source;
}
