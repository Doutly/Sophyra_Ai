import jsPDF from 'jspdf';

interface ReportData {
  overall_score: number;
  performance_breakdown: {
    clarity: number;
    confidence: number;
    relevance: number;
    professionalism: number;
    domain: number;
  };
  strengths: string[];
  gaps: string[];
  suggested_topics: string[];
  created_at: string;
  sessions: {
    role: string;
    company: string | null;
    experience_level: string;
  };
}

const metricLabels: Record<string, string> = {
  clarity: 'Communication Clarity',
  confidence: 'Confidence & Composure',
  relevance: 'Answer Relevance',
  professionalism: 'Professionalism',
  domain: 'Domain Knowledge',
};

function getScoreBand(score: number): string {
  if (score >= 85) return 'Exceptional';
  if (score >= 70) return 'Proficient';
  if (score >= 50) return 'Developing';
  return 'Needs Development';
}

function scoreColor(score: number, isHex = false): [number, number, number] {
  if (score >= 85) return isHex ? [16, 185, 129] : [16, 185, 129];
  if (score >= 70) return [59, 130, 246];
  if (score >= 50) return [245, 158, 11];
  return [239, 68, 68];
}

function metricScoreColor(score: number): [number, number, number] {
  if (score >= 8) return [16, 185, 129];
  if (score >= 6) return [59, 130, 246];
  if (score >= 4) return [245, 158, 11];
  return [239, 68, 68];
}

export async function downloadReportPDF(report: ReportData, reportId: string): Promise<void> {
  const pdf = new jsPDF({ orientation: 'portrait', unit: 'mm', format: 'a4' });
  const pageW = 210;
  const pageH = 297;
  const margin = 18;
  const contentW = pageW - margin * 2;

  let y = 0;

  function addPage() {
    pdf.addPage();
    y = margin;
    addWatermark();
    addPageHeader();
  }

  function checkSpace(needed: number) {
    if (y + needed > pageH - 20) addPage();
  }

  function addWatermark() {
    pdf.saveGraphicsState();
    pdf.setFontSize(60);
    pdf.setTextColor(240, 240, 240);
    pdf.text('Sophyra AI', pageW / 2, pageH / 2, {
      align: 'center',
      angle: 45,
    });
    pdf.restoreGraphicsState();
  }

  function addPageHeader() {
    pdf.setFillColor(248, 250, 252);
    pdf.rect(0, 0, pageW, 12, 'F');
    pdf.setFontSize(7);
    pdf.setTextColor(148, 163, 184);
    pdf.text('Sophyra AI — Confidential Interview Assessment', margin, 8);
    pdf.text(`Generated ${new Date().toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric' })}`, pageW - margin, 8, { align: 'right' });
  }

  addWatermark();

  pdf.setFillColor(15, 23, 42);
  pdf.rect(0, 0, pageW, 56, 'F');

  pdf.setFillColor(37, 99, 235);
  pdf.rect(0, 53, pageW, 3, 'F');

  pdf.setFontSize(9);
  pdf.setTextColor(100, 116, 139);
  pdf.text('SOPHYRA AI — INTERVIEW ASSESSMENT REPORT', margin, 16);

  pdf.setFontSize(20);
  pdf.setTextColor(255, 255, 255);
  pdf.text(report.sessions.role, margin, 30);

  pdf.setFontSize(10);
  pdf.setTextColor(148, 163, 184);
  const subLine = [
    report.sessions.company,
    report.sessions.experience_level + ' Level',
    new Date(report.created_at).toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric' }),
  ]
    .filter(Boolean)
    .join('  ·  ');
  pdf.text(subLine, margin, 40);

  const scoreBand = getScoreBand(report.overall_score);
  const scoreClr = scoreColor(report.overall_score);

  const badgeX = pageW - margin - 44;
  pdf.setFillColor(30, 41, 59);
  pdf.roundedRect(badgeX, 22, 44, 22, 3, 3, 'F');
  pdf.setFontSize(22);
  pdf.setTextColor(...scoreClr);
  pdf.text(String(report.overall_score), badgeX + 22, 36, { align: 'center' });
  pdf.setFontSize(7);
  pdf.setTextColor(148, 163, 184);
  pdf.text('/ 100', badgeX + 22, 41, { align: 'center' });

  pdf.setFontSize(8);
  pdf.setTextColor(...scoreClr);
  pdf.text(scoreBand.toUpperCase(), badgeX + 22, 48, { align: 'center' });

  y = 68;
  addPageHeader();

  pdf.setFontSize(11);
  pdf.setTextColor(15, 23, 42);
  pdf.setFont('helvetica', 'bold');
  pdf.text('Performance Breakdown', margin, y);
  y += 6;

  pdf.setDrawColor(226, 232, 240);
  pdf.setLineWidth(0.3);
  pdf.line(margin, y, pageW - margin, y);
  y += 5;

  Object.entries(report.performance_breakdown).forEach(([key, val]) => {
    checkSpace(14);
    const label = metricLabels[key] || key;
    const barColor = metricScoreColor(val);

    pdf.setFontSize(9);
    pdf.setFont('helvetica', 'normal');
    pdf.setTextColor(51, 65, 85);
    pdf.text(label, margin, y);

    const scoreStr = `${val}/10`;
    pdf.setFont('helvetica', 'bold');
    pdf.setTextColor(...barColor);
    pdf.text(scoreStr, pageW - margin, y, { align: 'right' });

    y += 3.5;
    pdf.setFillColor(226, 232, 240);
    pdf.roundedRect(margin, y, contentW, 3.5, 1, 1, 'F');
    pdf.setFillColor(...barColor);
    pdf.roundedRect(margin, y, (contentW * val) / 10, 3.5, 1, 1, 'F');
    y += 7;
  });

  y += 4;
  checkSpace(20);

  pdf.setFontSize(11);
  pdf.setFont('helvetica', 'bold');
  pdf.setTextColor(15, 23, 42);
  pdf.text('Strengths', margin, y);
  y += 5;

  pdf.setDrawColor(226, 232, 240);
  pdf.line(margin, y, pageW - margin, y);
  y += 5;

  report.strengths.forEach((s) => {
    checkSpace(12);
    const lines = pdf.splitTextToSize(s, contentW - 8);
    pdf.setFillColor(209, 250, 229);
    pdf.roundedRect(margin, y - 3.5, contentW, lines.length * 5 + 3, 2, 2, 'F');
    pdf.setFontSize(8.5);
    pdf.setFont('helvetica', 'normal');
    pdf.setTextColor(6, 78, 59);
    pdf.text('✓', margin + 2, y);
    pdf.setTextColor(6, 95, 70);
    pdf.text(lines, margin + 7, y);
    y += lines.length * 5 + 4;
  });

  y += 4;
  checkSpace(20);

  pdf.setFontSize(11);
  pdf.setFont('helvetica', 'bold');
  pdf.setTextColor(15, 23, 42);
  pdf.text('Areas for Development', margin, y);
  y += 5;

  pdf.setDrawColor(226, 232, 240);
  pdf.line(margin, y, pageW - margin, y);
  y += 5;

  report.gaps.forEach((g) => {
    checkSpace(12);
    const lines = pdf.splitTextToSize(g, contentW - 8);
    pdf.setFillColor(254, 243, 199);
    pdf.roundedRect(margin, y - 3.5, contentW, lines.length * 5 + 3, 2, 2, 'F');
    pdf.setFontSize(8.5);
    pdf.setFont('helvetica', 'normal');
    pdf.setTextColor(120, 53, 15);
    pdf.text('→', margin + 2, y);
    pdf.setTextColor(120, 53, 15);
    pdf.text(lines, margin + 7, y);
    y += lines.length * 5 + 4;
  });

  y += 4;
  checkSpace(20);

  pdf.setFontSize(11);
  pdf.setFont('helvetica', 'bold');
  pdf.setTextColor(15, 23, 42);
  pdf.text('Recommended Focus Areas', margin, y);
  y += 5;

  pdf.setDrawColor(226, 232, 240);
  pdf.line(margin, y, pageW - margin, y);
  y += 5;

  report.suggested_topics.forEach((topic, idx) => {
    checkSpace(10);
    pdf.setFillColor(239, 246, 255);
    pdf.roundedRect(margin, y - 3, contentW, 9, 2, 2, 'F');
    pdf.setFontSize(8.5);
    pdf.setFont('helvetica', 'bold');
    pdf.setTextColor(37, 99, 235);
    pdf.text(String(idx + 1), margin + 3, y + 1);
    pdf.setFont('helvetica', 'normal');
    pdf.setTextColor(30, 64, 175);
    pdf.text(topic, margin + 9, y + 1);
    y += 11;
  });

  y += 6;
  checkSpace(18);

  pdf.setFillColor(248, 250, 252);
  pdf.roundedRect(margin, y, contentW, 16, 3, 3, 'F');
  pdf.setDrawColor(226, 232, 240);
  pdf.roundedRect(margin, y, contentW, 16, 3, 3, 'S');

  pdf.setFontSize(8);
  pdf.setFont('helvetica', 'bold');
  pdf.setTextColor(51, 65, 85);
  pdf.text('Sophyra AI', margin + 4, y + 5);
  pdf.setFont('helvetica', 'normal');
  pdf.setTextColor(100, 116, 139);
  pdf.text('AI-Powered Interview Coaching Platform', margin + 4, y + 10);
  pdf.setFontSize(7);
  pdf.text('This report is confidential and generated exclusively for the assessed candidate.', margin + 4, y + 14.5);

  pdf.setFontSize(7);
  pdf.setTextColor(148, 163, 184);
  pdf.text(`Report ID: ${reportId}`, pageW - margin, y + 8, { align: 'right' });

  const role = report.sessions.role.replace(/[^a-z0-9]/gi, '_');
  const dateStr = new Date(report.created_at).toISOString().split('T')[0];
  pdf.save(`Sophyra_Report_${role}_${dateStr}.pdf`);
}
