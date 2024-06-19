// Get the canvas element and its context
const canvas = document.getElementById('myCanvas');
const rect = canvas.getBoundingClientRect();
const ctx = canvas.getContext('2d');

const COLOR_LIST = [
    "#ea3323","#ff8b00","#febb26","#1eb253","#017cf3","#4f7af9","#9c78fe"
];

let initial_points = [];
let min_max_coords = {};
let complementing_mode = false;
let alternating_mode = false;

// Function to add points to the array
canvas.addEventListener('click', function(event) {
    const x = event.clientX - rect.left;
    const y = event.clientY - rect.top;
    initial_points.push({ x, y });
    generate_polygons();
});

function generate_polygons() {
    var coordinate_box_text = "Initial Polygon:"+polygon_to_text(initial_points);

    min_max_coords = {
        min_x:rect.width/2,
        min_y:rect.height/2,
        max_x:rect.width/2,
        max_y:rect.height/2
    };

    draw_polygon(initial_points, COLOR_LIST[(initial_points.length-2)%COLOR_LIST.length], true);
    const number_of_points = initial_points.length;
    if (number_of_points < 3) return;
    
    // Generate ear angles
    let ear_angle_list = Array.from({ length: number_of_points - 2 }, (_, i) =>
                            (360.0 / number_of_points) * (i + 1));

    if (complementing_mode) {
        let temp_ear_angle_list = [];
        for (let i = 0; i < ear_angle_list.length/2;i++){
            temp_ear_angle_list.push(ear_angle_list[i]);
            if (i != ear_angle_list.length-i-1) {
                temp_ear_angle_list.push(ear_angle_list[ear_angle_list.length-i-1]);
            }
        }
        ear_angle_list = temp_ear_angle_list;
    }
    
    let previous_points_list = initial_points;
    for (let ear_index = 0; ear_index < ear_angle_list.length; ear_index++){
        // Calculate height of isosceles triangle with ear angle and base length 1
        const base_height = 0.5 / Math.tan((ear_angle_list[ear_index]*Math.PI/180)/2)

        let points_list = [];
        for (let line_index = 0; line_index < number_of_points; line_index++){
            const point_A = previous_points_list[line_index];
            const point_B = line_index == number_of_points-1 ?
                            previous_points_list[0] :
                            previous_points_list[line_index+1];

            let scaled_height = base_height
                                * Math.sqrt(Math.pow(point_A.x-point_B.x,2)+
                                Math.pow(point_A.y-point_B.y,2));
            
            let midpoint = { x:(point_A.x + point_B.x)/2, y:(point_A.y + point_B.y)/2};

            let normal = {
                x:point_A.y-point_B.y,
                y:point_B.x-point_A.x
            }
            let normal_length = Math.sqrt(Math.pow(normal.x,2)+Math.pow(normal.y,2));
            normal = {
                x:normal.x/normal_length,
                y:normal.y/normal_length
            }
            
            let new_point = {
                x:midpoint.x + scaled_height * normal.x,
                y:midpoint.y + scaled_height * normal.y
            }

            min_max_coords = {
                min_x:Math.min(min_max_coords.min_x, new_point.x),
                min_y:Math.min(min_max_coords.min_y, new_point.y),
                max_x:Math.max(min_max_coords.max_x, new_point.x),
                max_y:Math.max(min_max_coords.max_y, new_point.y)
            }

            points_list.push(new_point);
        }
        if (!(alternating_mode && ear_index%2)){
            draw_polygon(points_list,COLOR_LIST[(number_of_points-3-ear_index)%COLOR_LIST.length]);
        }

        let ear_angle_text = ear_angle_list[ear_index];
        ear_angle_text = ear_angle_text % 1 ? ear_angle_text.toFixed(2) : ear_angle_text;
        coordinate_box_text += `\nApplying ${ear_angle_text}°:` + polygon_to_text(points_list);
        previous_points_list = points_list;
    }
    document.getElementById("coordinate_box").innerText = coordinate_box_text;
}

function draw_polygon(point_list, color, clear_canvas=false) {
    if (clear_canvas) ctx.clearRect(0, 0, canvas.width, canvas.height);

    // Draw lines
    ctx.strokeStyle = color
    ctx.beginPath();
    ctx.moveTo(point_list[0].x, point_list[0].y);
    for (let i = 1; i < point_list.length; i++) ctx.lineTo(point_list[i].x, point_list[i].y);
    if (point_list.length > 2) ctx.closePath();
    ctx.stroke();

    // Draw dots
    ctx.fillStyle = "#000"; ctx.strokeStyle = "#000";
    for (let i = 0; i < point_list.length; i++) {        
        ctx.beginPath();
        ctx.arc(point_list[i].x, point_list[i].y, 3, 0, Math.PI * 2);
        ctx.fill();
        ctx.stroke();
    }
}

function polygon_to_text(point_list) {
    let output_text = "{";
    point_list.forEach(point => {
        let point_x = point.x % 1 ? point.x.toFixed(1) : point.x;
        let point_y = point.y % 1 ? point.y.toFixed(1) : point.y;
        output_text += `(${point_x},${point_y}), `
    })
    return output_text.slice(0,-2) + "}"
}

function resetCanvas() {
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    initial_points = [];
    document.getElementById("coordinate_box").innerText = "";
}

function resizeCanvas() {

    let data_center = {
        x: (min_max_coords.max_x + min_max_coords.min_x)/2,
        y: (min_max_coords.max_y + min_max_coords.min_y)/2
    }

    let x_translate = data_center.x - rect.width/2;
    let y_translate = data_center.y - rect.height/2;
    
    let data_width = Math.abs(min_max_coords.max_x - min_max_coords.min_x);
    let data_height = Math.abs(min_max_coords.max_y - min_max_coords.min_y);

    // Scale is padded by 10 percent
    let x_scale = rect.width / data_width - 0.1;
    let y_scale = rect.height / data_height - 0.1;

    let scale = Math.min(x_scale, y_scale);

    initial_points.forEach(point => {
        point.x = (point.x - rect.left) * scale + rect.left - x_translate;
        point.y = (point.y - rect.top) * scale + rect.top - y_translate;
    })

    generate_polygons();
}

function toggle_complementing_mode(toggle_value=null){
    if (toggle_value == null) {
        complementing_mode = !complementing_mode;
        document.getElementById("complementing_mode_toggle").checked = complementing_mode;
    }
    else complementing_mode = toggle_value;
    generate_polygons();
}

function toggle_alternating_mode(toggle_value=null){
    if (toggle_value == null) {
        alternating_mode = !alternating_mode;
        document.getElementById("alternating_mode_toggle").checked = alternating_mode;
    }
    else alternating_mode = toggle_value;
    generate_polygons();
}

// Event listener for keyboard events
document.addEventListener('keydown', function(event) {
    if (event.key === 'q') resetCanvas();
    if (event.key === 's') resizeCanvas();
    if (event.key === 'c') toggle_complementing_mode();
    if (event.key === 'a') toggle_alternating_mode();
});