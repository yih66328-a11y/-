// Scroll Animation with IntersectionObserver
document.addEventListener("DOMContentLoaded", () => {
    const observerOptions = { root: null, rootMargin: "0px", threshold: 0.15 };
    const observer = new IntersectionObserver((entries, observer) => {
        entries.forEach(entry => {
            if (entry.isIntersecting) {
                entry.target.classList.add("is-visible");
                observer.unobserve(entry.target);
            }
        });
    }, observerOptions);

    const animatedElements = document.querySelectorAll('.animate-on-scroll');
    animatedElements.forEach(el => observer.observe(el));

    initEDChart();
    initBlindnessChart();
    initFlowChart();
    initDoseChart();
    initRiskChart();
});

// Chart 1: 吸烟量与ED风险
function initEDChart() {
    const chartDom = document.getElementById('chart-ed');
    if(!chartDom) return;
    const myChart = echarts.init(chartDom);

    const rawData = [
        { name: '从不吸烟', label: '从不吸烟', x: 0, y: 1.00, ciLow: null, ciHigh: null },
        { name: '轻度吸烟', label: '轻度吸烟\n(10支/日)', x: 10, y: 1.14, ciLow: 1.09, ciHigh: 1.18 },
        { name: '中度吸烟', label: '中度吸烟\n(20支/日)', x: 20, y: 1.30, ciLow: 1.18, ciHigh: 1.39 },
        { name: '重度吸烟', label: '重度吸烟\n(30支/日)', x: 30, y: 1.48, ciLow: 1.28, ciHigh: 1.63 }
    ];

    // 恢复为原文档的黄色系
    const mainColor = 'rgba(229, 168, 18, 0.75)'; 
    const borderColor = '#B8860B'; 
    const errorColor = '#B8860B';
    const emphasisColor = 'rgba(229, 168, 18, 0.95)';
    const refLineColor = '#999999';

    const option = {
        animation: true, animationDuration: 1800, animationEasing: 'cubicOut',
        tooltip: {
            trigger: 'item', backgroundColor: 'rgba(255,255,255,0.96)',
            borderColor: '#ddd', borderWidth: 1, padding: [12, 16],
            textStyle: { color: '#333', fontSize: 13 },
            extraCssText: 'box-shadow: 0 2px 10px rgba(0,0,0,0.1); border-radius: 6px;',
            formatter: function(params) {
                const d = rawData[params.dataIndex];
                let html = '<div style="font-weight:bold;margin-bottom:8px;font-size:14px;">' + d.name + '</div>';
                html += '<div>每日吸烟量：<b>' + d.x + ' 支/天</b></div>';
                html += '<div>OR值：<b style="color:' + borderColor + ';">' + d.y.toFixed(2) + '</b></div>';
                if (d.ciLow !== null) { html += '<div>95% CI：<b>' + d.ciLow.toFixed(2) + ' - ' + d.ciHigh.toFixed(2) + '</b></div>'; } 
                else { html += '<div>95% CI：- (参照组)</div>'; }
                return html;
            }
        },
        grid: { left: 70, right: 50, top: 40, bottom: 80 },
        xAxis: {
            type: 'category', name: '每日吸烟量', nameLocation: 'middle', nameGap: 45,
            data: rawData.map(d => d.label),
            axisLine: { lineStyle: { color: '#888' } }, axisTick: { show: true, alignWithLabel: true },
            axisLabel: { color: '#555', fontSize: 12, interval: 0, lineHeight: 16 }, splitLine: { show: false }
        },
        yAxis: {
            type: 'value', name: 'ED风险（OR值）', nameLocation: 'middle', nameGap: 50,
            min: 0.8, max: 1.7, interval: 0.1,
            axisLine: { lineStyle: { color: '#888' } }, axisTick: { show: true, lineStyle: { color: '#888' } },
            axisLabel: { color: '#555', fontSize: 12 }, splitLine: { show: true, lineStyle: { type: 'dashed', color: '#eee' } }
        },
        series: [
            {
                type: 'custom',
                renderItem: function(params, api) {
                    const d = rawData[params.dataIndex];
                    if (d.ciLow === null || d.ciHigh === null) return;
                    const x = api.coord([params.dataIndex, 0])[0];
                    const yLow = api.coord([0, d.ciLow])[1]; const yHigh = api.coord([0, d.ciHigh])[1]; const capWidth = 6;
                    return {
                        type: 'group',
                        children: [
                            { type: 'line', shape: { x1: x, y1: yLow, x2: x, y2: yHigh }, style: { stroke: errorColor, lineWidth: 2 } },
                            { type: 'line', shape: { x1: x - capWidth, y1: yHigh, x2: x + capWidth, y2: yHigh }, style: { stroke: errorColor, lineWidth: 2 } },
                            { type: 'line', shape: { x1: x - capWidth, y1: yLow, x2: x + capWidth, y2: yLow }, style: { stroke: errorColor, lineWidth: 2 } }
                        ]
                    };
                },
                data: rawData, z: 2, silent: true,
            },
            {
                type: 'scatter', data: rawData.map(d => d.y), symbolSize: 18,
                itemStyle: { color: mainColor, borderColor: borderColor, borderWidth: 2.5, shadowBlur: 4, shadowColor: 'rgba(184, 134, 11, 0.2)' },
                label: { show: true, position: 'top', formatter: params => rawData[params.dataIndex].y.toFixed(2), color: '#444', fontSize: 13, fontWeight: 'bold', distance: 12 }, z: 3,
            },
            {
                type: 'line', markLine: {
                    silent: true, symbol: 'none', lineStyle: { type: 'dashed', color: refLineColor, width: 1.5 },
                    label: { formatter: 'OR = 1.00', position: 'end', color: '#aaa', fontSize: 11, distance: 8 }, data: [{ yAxis: 1.00 }]
                }
            }
        ]
    };
    myChart.setOption(option);
    window.addEventListener('resize', () => myChart.resize());
}

// Chart 2: 失明负担
function initBlindnessChart() {
    const chartDom = document.getElementById('chart-blindness');
    if(!chartDom) return;
    const myChart = echarts.init(chartDom);
    const option = {
        tooltip: { trigger: 'item', formatter: '{a}<br/>{b}: {c} 年/10万人' },
        legend: { data: ['南亚', '东南亚', '北非和中东', '东亚', '全球平均'], left: 'center', bottom: 0, itemWidth: 20, itemHeight: 12, textStyle: { fontSize: 12 } },
        radar: {
            indicator: [ { name: '总体负担', max: 5 }, { name: '男性负担', max: 5 }, { name: '女性负担', max: 5 } ],
            shape: 'circle', center: ['50%', '45%'], radius: '65%',
            name: { textStyle: { fontSize: 13, color: '#333' } },
            // 恢复为原文档的浅橙色分割区
            splitArea: { areaStyle: { color: ['rgba(255,140,66,0.05)'] } },
            axisLine: { lineStyle: { color: '#ccc' } }
        },
        series: [{
            name: '吸烟致盲负担', type: 'radar',
            data: [
                { value: [4.2, 3.44, 0.76], name: '南亚' }, { value: [3.9, 3.2, 0.7], name: '东南亚' },
                { value: [3.5, 2.87, 0.63], name: '北非和中东' }, { value: [0.68, 0.56, 0.12], name: '东亚' },
                { value: [3.27, 2.68, 0.59], name: '全球平均' }
            ],
            areaStyle: { opacity: 0.3 },
            lineStyle: { width: 2 },
            itemStyle: { symbolSize: 6 }
        }],
        backgroundColor: 'transparent'
    };
    myChart.setOption(option);
    window.addEventListener('resize', () => myChart.resize());
}

// D3 Chart 1: Flow chart
function initFlowChart() {
    const container = document.getElementById('flow-chart-container');
    if(!container) return;
    // 恢复为原文档从绿到黑的渐变色
    const steps = [
        { label: "吸烟", detail: "每天1-2包", color: "#4caf50", time: "起点", description: "烟草中的尼古丁和一氧化碳损伤血管内皮，启动动脉粥样硬化进程。", data: "吸烟者PAD风险 OR=2.71 (95% CI 2.28-3.21)" },
        { label: "内皮损伤", detail: "血管内壁受损", color: "#8bc34a", time: "数周-数月", description: "内皮依赖性舒张功能下降，一氧化碳降低携氧能力，炎症反应启动。", data: "内皮功能下降约30%，黏附分子表达增加" },
        { label: "动脉粥样硬化", detail: "斑块形成", color: "#ffc107", time: "5-10年", description: "脂质沉积、斑块形成，血管壁增厚。吸烟者斑块进展速度是非吸烟者的2-3倍。", data: "下肢动脉粥样硬化发生率增加3-4倍" },
        { label: "血管狭窄", detail: "管腔阻塞>50%", color: "#ff9800", time: "10-15年", description: "狭窄超过50%后，运动时血供不足；晚期静息时也受影响。", data: "PAD患者中约20-25%最终需要截肢" },
        { label: "间歇性跛行", detail: "行走时腿痛", color: "#ff5722", time: "10-20年", description: "小腿肌肉缺血疼痛，休息可缓解，典型PAD早期症状。", data: "约1/3的PAD患者有间歇性跛行" },
        { label: "静息痛", detail: "不活动也痛", color: "#d32f2f", time: "15-25年", description: "肢体严重缺血，夜间疼痛加重，慢性威胁性肢体缺血（CLTI）标志。", data: "CLTI患者1年内截肢率约25%" },
        { label: "溃疡", detail: "皮肤破溃", color: "#b71c1c", time: "晚期", description: "难以愈合的足部溃疡，常见于足趾、足跟。吸烟使愈合时间延长40%。", data: "糖尿病足溃疡患者中吸烟者占40-60%" },
        { label: "坏疽", detail: "组织坏死", color: "#212121", time: "终末期", description: "组织缺血坏死呈黑色，可继发感染，危及生命。", data: "坏疽后截肢率极高，常需紧急手术" },
        { label: "截肢", detail: "最终结局", color: "#000000", time: "终末期", description: "当坏疽无法控制、感染扩散或剧烈疼痛时，必须截肢保命。", data: "Buerger病患者中93.2%有吸烟史；截肢后5年死亡率约50%" }
    ];

    const cols = 3, rows = 3, boxWidth = 280, boxHeight = 140, gapX = 60, gapY = 80;
    const positions = [];
    for (let row = 0; row < rows; row++) {
        for (let col = 0; col < cols; col++) {
            let actualCol = col;
            if (row % 2 === 1) actualCol = cols - 1 - col;
            const x = actualCol * (boxWidth + gapX); const y = row * (boxHeight + gapY); const stepIdx = row * cols + col;
            positions.push({ stepIdx, x, y, row, col: actualCol });
        }
    }
    const stepPositions = new Array(steps.length);
    positions.forEach(p => { stepPositions[p.stepIdx] = { x: p.x, y: p.y, row: p.row, col: p.col }; });

    const maxX = (cols-1)*(boxWidth+gapX)+boxWidth; const maxY = (rows-1)*(boxHeight+gapY)+boxHeight;
    const margin = { top: 40, right: 40, bottom: 40, left: 40 };
    const width = maxX + margin.left + margin.right; const height = maxY + margin.top + margin.bottom;

    const svg = d3.select("#flow-chart-container").append("svg").attr("viewBox", `0 0 ${width} ${height}`)
        .attr("preserveAspectRatio", "xMidYMid meet").style("width", "100%").style("height", "100%")
        .append("g").attr("transform", `translate(${margin.left},${margin.top})`);

    svg.append("defs").append("marker").attr("id", "arrowhead").attr("viewBox", "0 -5 10 10")
        .attr("refX", 10).attr("refY", 0).attr("markerWidth", 8).attr("markerHeight", 8).attr("orient", "auto")
        .append("path").attr("d", "M0,-5L10,0L0,5").attr("fill", "#999");

    for (let i=0; i<steps.length-1; i++) {
        const from = stepPositions[i]; const to = stepPositions[i+1];
        if (!from || !to) continue;
        const fromCenterX = from.x + boxWidth/2; const fromBottomY = from.y + boxHeight;
        const toCenterX = to.x + boxWidth/2; const toTopY = to.y;
        if (from.row === to.row) {
            let fromX, toX, fromY, toY;
            if (from.col < to.col) { fromX = from.x + boxWidth; toX = to.x; } else { fromX = from.x; toX = to.x + boxWidth; }
            fromY = toY = from.y + boxHeight/2;
            svg.append("line").attr("x1", fromX).attr("y1", fromY).attr("x2", toX-5).attr("y2", toY)
                .attr("marker-end", "url(#arrowhead)").attr("stroke", "#999").attr("stroke-width", 2);
        } else {
            const vertOffset = gapY/2;
            const pathData = `M ${fromCenterX} ${fromBottomY} L ${fromCenterX} ${fromBottomY+vertOffset} L ${toCenterX} ${fromBottomY+vertOffset} L ${toCenterX} ${toTopY-5}`;
            svg.append("path").attr("d", pathData).attr("marker-end", "url(#arrowhead)").attr("fill", "none")
                .attr("stroke", "#999").attr("stroke-width", 2);
        }
    }

    const tooltip = d3.select("body").append("div").style("position", "absolute").style("background", "rgba(255,255,255,0.95)")
        .style("color", "#333").style("padding", "12px").style("border-radius", "4px").style("box-shadow", "0 2px 8px rgba(0,0,0,0.1)")
        .style("border", "1px solid #ddd").style("font-size", "13px").style("pointer-events", "none").style("opacity", 0).style("z-index", 100).style("max-width", "250px");

    steps.forEach((step, idx) => {
        const pos = stepPositions[idx];
        const group = svg.append("g").attr("transform", `translate(${pos.x},${pos.y})`).style("cursor", "pointer");
        group.append("rect").attr("width", boxWidth).attr("height", boxHeight).attr("fill", step.color).attr("rx", 6);
        group.append("text").attr("x", boxWidth/2).attr("y", boxHeight/2 - 10).text(step.label)
            .attr("fill", "#fff").attr("font-size", "22px").attr("font-weight", "600").attr("text-anchor", "middle");
        group.append("text").attr("x", boxWidth/2).attr("y", boxHeight/2 + 20).text(step.detail)
            .attr("fill", "rgba(255,255,255,0.9)").attr("font-size", "14px").attr("text-anchor", "middle");
        group.append("text").attr("x", boxWidth/2).attr("y", boxHeight - 15).text(step.time)
            .attr("fill", "rgba(255,255,255,0.7)").attr("font-size", "12px").attr("text-anchor", "middle");

        group.on("mouseover", (event) => {
            tooltip.style("opacity", 1).html(`<strong>${step.label} · ${step.detail}</strong><br><span style="color:#888;">${step.time}</span><br><br>${step.description}<br><br><span style="color:#ffb347;font-weight:600;">关键数据：</span> ${step.data}`)
                .style("left", (event.pageX+15)+"px").style("top", (event.pageY-10)+"px");
        }).on("mouseout", () => tooltip.style("opacity", 0));
    });
}

// D3 Chart 2: Dose curve
function initDoseChart() {
    const container = document.getElementById('dose-chart-container');
    if(!container) return;
    const doseData = [
        { packs: 0, risk: 1.0, label: "从未吸烟" }, { packs: 10, risk: 1.5, label: "10包/年" },
        { packs: 20, risk: 2.0, label: "20包/年" }, { packs: 30, risk: 2.7, label: "30包/年" },
        { packs: 40, risk: 3.5, label: "40包/年" }, { packs: 50, risk: 4.0, label: "50包/年" }
    ];

    const margin = { top: 40, right: 60, bottom: 60, left: 80 };
    const width = 1100 - margin.left - margin.right; const height = 600 - margin.top - margin.bottom;

    const svg = d3.select("#dose-chart-container").append("svg").attr("viewBox", `0 0 ${width+margin.left+margin.right} ${height+margin.top+margin.bottom}`)
        .attr("preserveAspectRatio", "xMidYMid meet").style("width", "100%").style("height", "100%")
        .append("g").attr("transform", `translate(${margin.left},${margin.top})`);

    const xScale = d3.scaleLinear().domain([-5, 55]).range([0, width]);
    const xAxis = d3.axisBottom(xScale).tickValues([0,10,20,30,40,50]).tickFormat(d => d + "包/年");
    svg.append("g").attr("transform", `translate(0, ${height})`).call(xAxis).selectAll("text").style("font-size", "13px").style("fill", "#666");
    svg.append("text").attr("x", width/2).attr("y", height+45).attr("text-anchor", "middle").style("font-size", "14px").style("fill", "#444").text("累计吸烟量（包/年）");

    const yScale = d3.scaleLinear().domain([0, 4.5]).range([height, 0]);
    const yAxis = d3.axisLeft(yScale).tickValues([0,1,2,3,4]).tickFormat(d => d + "x");
    svg.append("g").call(yAxis).selectAll("text").style("font-size", "13px").style("fill", "#666");
    svg.append("text").attr("transform", "rotate(-90)").attr("x", -height/2).attr("y", -50).attr("text-anchor", "middle").style("font-size", "14px").style("fill", "#444").text("PAD相对风险（倍数）");

    svg.selectAll(".grid-line").data([1,2,3,4]).enter().append("line").attr("x1",0).attr("x2",width).attr("y1", d=>yScale(d)).attr("y2", d=>yScale(d))
       .attr("stroke","#eee").attr("stroke-dasharray","4,4").attr("stroke-width",1);

    const lineGen = d3.line().x(d=>xScale(d.packs)).y(d=>yScale(d.risk)).curve(d3.curveMonotoneX);
    // 恢复为原文档的红色 #c41e3a
    svg.append("path").datum(doseData).attr("d", lineGen).attr("stroke","#c41e3a").attr("stroke-width",3).attr("fill","none");
    svg.selectAll(".dose-point").data(doseData).enter().append("circle").attr("class", "dose-point").attr("cx", d=>xScale(d.packs)).attr("cy", d=>yScale(d.risk))
       .attr("r", 6).attr("fill","#c41e3a").attr("stroke","#fff").attr("stroke-width",2);

    const tooltip = d3.select("body").append("div").style("position", "absolute").style("background", "rgba(255,255,255,0.95)")
        .style("color", "#333").style("padding", "10px").style("border-radius", "4px").style("border", "1px solid #ddd").style("font-size", "13px")
        .style("pointer-events", "none").style("opacity", 0).style("z-index", 100);

    svg.selectAll(".dose-point").on("mouseover", (event,d) => {
        tooltip.style("opacity", 1).html(`<strong>${d.label}</strong><br>风险倍数: ${d.risk}x`)
            .style("left", (event.pageX+15)+"px").style("top", (event.pageY-10)+"px");
    }).on("mouseout", () => tooltip.style("opacity", 0));
}

// D3 Chart 3: Risk bar chart
function initRiskChart() {
    const container = document.getElementById('risk-chart-container');
    if(!container) return;
    // 恢复为原文档的红绿对比色
    const barData = [
        { group: "非吸烟人群", risk: 1.0, color: "#4caf50", detail: "PAD发生率约3-5%" },
        { group: "吸烟人群", risk: 3.5, color: "#d32f2f", detail: "PAD发生率约10-15%" }
    ];

    const margin = { top: 40, right: 40, bottom: 60, left: 80 };
    const width = 800 - margin.left - margin.right; const height = 500 - margin.top - margin.bottom;

    const svg = d3.select("#risk-chart-container").append("svg").attr("viewBox", `0 0 ${width+margin.left+margin.right} ${height+margin.top+margin.bottom}`)
        .attr("preserveAspectRatio", "xMidYMid meet").style("width", "100%").style("height", "100%")
        .append("g").attr("transform", `translate(${margin.left},${margin.top})`);

    const xScale = d3.scaleBand().domain(barData.map(d=>d.group)).range([0,width]).padding(0.4);
    const yScale = d3.scaleLinear().domain([0,4]).range([height,0]);

    svg.append("g").call(d3.axisLeft(yScale).tickValues([0,1,2,3,4]).tickFormat(d=>d+"x")).selectAll("text").style("font-size","13px").style("fill","#666");
    svg.append("g").attr("transform", `translate(0,${height})`).call(d3.axisBottom(xScale).tickSize(0)).selectAll("text").style("font-size","14px").style("fill","#444").attr("dy", "1em");

    svg.selectAll(".grid-line").data([1,2,3,4]).enter().append("line").attr("x1",0).attr("x2",width).attr("y1", d=>yScale(d)).attr("y2", d=>yScale(d))
       .attr("stroke","#eee").attr("stroke-dasharray","4,4").attr("stroke-width",1);

    svg.selectAll(".bar").data(barData).enter().append("rect").attr("x", d=>xScale(d.group)).attr("y", d=>yScale(d.risk))
       .attr("width", xScale.bandwidth()).attr("height", d=>height-yScale(d.risk)).attr("fill", d=>d.color).attr("rx", 4);

    svg.selectAll(".label").data(barData).enter().append("text").attr("x", d=>xScale(d.group)+xScale.bandwidth()/2)
       .attr("y", d=>yScale(d.risk)-10).attr("text-anchor", "middle").style("font-size", "16px").style("font-weight", "600").style("fill", d=>d.color).text(d=>d.risk+"x");

    svg.selectAll(".detail").data(barData).enter().append("text").attr("x", d=>xScale(d.group)+xScale.bandwidth()/2)
       .attr("y", d=>yScale(d.risk) + (height-yScale(d.risk))/2).attr("text-anchor", "middle").style("font-size", "13px").style("fill", "#fff").text(d=>d.detail);
}
