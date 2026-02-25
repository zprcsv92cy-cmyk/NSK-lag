function exportPDF(){
  const content = document.getElementById("editOutput").innerHTML;

  const w = window.open("", "_blank");
  if(!w){
    window.print();
    return;
  }

  w.document.write(`
    <html>
      <head>
        <title>NSK PDF</title>
        <meta name="viewport" content="width=device-width,initial-scale=1">
        <style>
          body{font-family:Arial;padding:20px}
        </style>
      </head>
      <body>
        ${content}
        <script>
          window.onload = () => {
            window.print();
          };
        <\/script>
      </body>
    </html>
  `);
  w.document.close();
}
