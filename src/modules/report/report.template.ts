// modules/report/report.template.ts
export const ReportTemplate = {
    generateMonthlyHTML: (data: any) => {
      const { periode, resume, tableauBord, analyseAbs, analyseRetards, graphes, recommandations } = data;
      const monthName = new Date(periode.startDate).toLocaleString("fr-FR", { month: "long" });
  
      const tableRows = tableauBord.map((r:any) => `
        <tr>
          <td>${r.service}</td>
          <td>${r.eff}</td>
          <td>${r.abs}</td>
          <td>${r.retards}</td>
          <td>${r.dep}</td>
        </tr>
      `).join("");
  
      return `<!doctype html>
  <html lang="fr">
  <head>
  <meta charset="utf-8"/>
  <title>Rapport Mensuel - ${monthName} ${periode.year}</title>
  <style>
    body{font-family:Arial,Helvetica,sans-serif;padding:20px;color:#111}
    h1{text-align:center}
    .muted{color:#666;font-size:13px}
    table{width:100%;border-collapse:collapse;margin-top:10px}
    th,td{border:1px solid #ccc;padding:8px;text-align:center}
    th{background:#f4f4f4}
    .section{margin-top:30px}
    .two-col{display:flex;gap:20px}
    .col{flex:1}
    .graph{margin-top:12px;text-align:center}
    .small{font-size:12px;color:#555}
  </style>
  </head>
  <body>
    <h1>RAPPORT MENSUEL DES POINTAGES</h1>
    <h3>SERVICE REGIONAL DU BUDGET</h3>
    <h4>Haute Matsiatra</h4>
    <p class="muted">Période : Mois de ${monthName} ${periode.year}</p>
    <hr/>
  
    <div class="section">
      <h2>1. RÉSUMÉ EXÉCUTIF</h2>
      <table>
        <thead>
          <tr><th>Indicateur</th><th>Semaine précédente</th><th>Cette semaine</th><th>Variation</th><th>Commentaire</th></tr>
        </thead>
        <tbody>
          <tr>
            <td>Taux d'absentéisme</td>
            <td>${resume.absPrev ?? "-"}</td>
            <td>${resume.absCurrent}%</td>
            <td>${resume.absDelta}%</td>
            <td>${resume.absComment}</td>
          </tr>
          <tr>
            <td>Retards</td>
            <td>${resume.retardsPrev ?? "-"}</td>
            <td>${resume.retardsCurrent}</td>
            <td>${resume.retardsDelta}</td>
            <td>${resume.retardsComment}</td>
          </tr>
          <tr>
            <td>Effectif moyen</td>
            <td>${resume.effPrev ?? "-"}</td>
            <td>${resume.effCurrent}</td>
            <td>${resume.effDelta ?? "-"}</td>
            <td>${resume.effComment}</td>
          </tr>
        </tbody>
      </table>
  
      <h4>Points marquants :</h4>
      <ul>
        ${(resume.points || []).map((p:string)=>`<li>${p}</li>`).join("")}
      </ul>
    </div>
  
    <div class="section">
      <h2>2. DONNÉES DÉTAILLÉES</h2>
      <h3>2.1 Tableau de bord par service</h3>
      <table>
        <thead>
          <tr><th>Service</th><th>Effectif</th><th>Taux Abs.</th><th>Retards</th><th>Départs Anticipés</th></tr>
        </thead>
        <tbody>
          ${tableRows}
          <tr style="font-weight:bold">
            <td>TOTAL / MOYENNE</td>
            <td>${Math.round(tableauBord.reduce((s:any,r:any)=>s + r.eff,0))}</td>
            <td>${tableauBord.length ? (tableauBord.map((r:any)=>parseFloat(r.abs)).reduce((s:number,n:number)=>s+n,0)/tableauBord.length).toFixed(1) + '%' : '0%'}</td>
            <td>${tableauBord.reduce((s:any,r:any)=>s + r.retards,0)}</td>
            <td>${tableauBord.reduce((s:any,r:any)=>s + r.dep,0)}</td>
          </tr>
        </tbody>
      </table>
  
      <h3>2.2 Analyse des Absences (${analyseAbs.total} heures totales)</h3>
      <ul>
        ${analyseAbs.details.map((d:any)=>`<li>${d.label} : ${d.heures} heures (${d.pourcentage}%)</li>`).join("")}
      </ul>
  
      <h3>2.3 Analyse des Retards (${analyseRetards.total} retards totaux)</h3>
      <ul>
        <li>Retards 5–15 min : ${analyseRetards.court}</li>
        <li>Retards 15–30 min : ${analyseRetards.moyen}</li>
        <li>Retards >30 min : ${analyseRetards.long}</li>
      </ul>
      <p>Employés récurrents (>2 retards) : ${analyseRetards.recurrents.join(", ") || "Aucun"}</p>
    </div>
  
    <div class="section">
      <h2>3. GRAPHIQUES SYNTHÉTIQUES</h2>
        <div>
          <h4>3.1 Évolution du Taux d'Absentéisme (4 périodes)</h4>
          <div class="graph"><img src="${graphes.absenteisme4Semaines}" alt="absentéisme"/></div>
        </div>
        <div>
          <h4>3.2 Évolution du Taux de retard (4 périodes)</h4>
          <div class="graph"><img src="${graphes.retards4Semaines}" alt="retards"/></div>
        </div>
      
    </div>
  
    <div class="section">
      <h2>4. COMMENTAIRES & RECOMMANDATIONS</h2>
      ${recommandations.map((r:any,i:number)=>`
        <p><strong>${i+1}. Problème identifié :</strong> ${r.probleme}</p>
        <ul>
          <li><strong>Cause probable :</strong> ${r.cause}</li>
          <li><strong>Actions recommandées :</strong>
            <ul>${r.actions.map((a:string)=>`<li>${a}</li>`).join("")}</ul>
          </li>
        </ul>
      `).join("")}
    </div>
  
    <hr/>
    <p class="small">Annexes : liste détaillée des écarts individuels / données brutes. Ce rapport est établi à titre informatique. Toute anomalie doit être signalée sous 48h.</p>
  </body>
  </html>`;
    }
  };
  