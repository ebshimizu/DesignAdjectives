<template>
  <div class="h-full w-full p-2">
    <div class="relative h-full w-full">
      <canvas ref="chart"></canvas>
    </div>
  </div>
</template>

<script>
import Chart from 'chart.js';

export default {
  name: 'debug-panel',
  data() {
    return {
      chart: null
    };
  },
  computed: {
    losses() {
      return this.$store.getters.currentLosses;
    }
  },
  mounted: function() {
    this.chart = new Chart(this.$refs.chart, {
      type: 'line',
      data: {
        datasets: [
          {
            data: [],
            label: 'loss',
            backgroundColor: 'rgba(182, 255, 160, 0.7)'
          }
        ]
      },
      options: {
        maintainAspectRatio: false,
        legend: {
          labels: {
            fontColor: '#edf2f7'
          }
        },
        scales: {
          xAxes: [
            {
              type: 'linear',
              gridLines: {
                color: 'rgba(237, 242, 247, 0.37)'
              },
              ticks: {
                fontColor: '#edf2f7'
              }
            }
          ],
          yAxes: [
            {
              type: 'linear',
              gridLines: {
                color: 'rgba(237, 242, 247, 0.37)'
              },
              ticks: {
                fontColor: '#edf2f7'
              }
            }
          ]
        }
      }
    });
  },
  watch: {
    losses: function(newLoss, oldLoss) {
      const pts = [];
      for (const i in newLoss) {
        pts.push({ x: i, y: newLoss[i] });
      }

      this.chart.data.datasets[0].data = pts;
      this.chart.update();
    }
  }
};
</script>
